import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TodoRepository } from './todo.repository';
import { TodoStatus } from './todo-status.enum';
import { Todo } from './todo.entity';

@Injectable()
export class TodoService {
  constructor(private readonly todoRepo: TodoRepository) {}

  async add(description: string, dueDatetime: Date): Promise<Todo> {
    const todo = this.todoRepo.create(description, dueDatetime);
    return this.todoRepo.save(todo);
  }

  async getOne(id: string): Promise<Todo> {
    const todo = await this.todoRepo.findById(id);
    if (!todo) {
      throw new NotFoundException(`Todo ${id} not found`);
    }
    return this.recalculatePastDue(todo);
  }

  async getAll(filterByStatus?: TodoStatus): Promise<Todo[]> {
    const todos = filterByStatus !== undefined 
      ? await this.todoRepo.findBy({ status: filterByStatus })
      : await this.todoRepo.findAll();
    
    return this.updatePastDueBatch(todos);
  }

  private async updatePastDueBatch(todos: Todo[]): Promise<Todo[]> {
    const now = new Date();
    const todosToUpdate: Todo[] = [];
    const updateMap = new Map<string, Todo>();

    for (const todo of todos) {
      if (todo.status === TodoStatus.NOT_DONE && now > todo.dueDatetime) {
        const updatedTodo = {...todo, status: TodoStatus.PAST_DUE };
        todosToUpdate.push(updatedTodo);
        updateMap.set(todo.id, updatedTodo);
      }
    }

    if (todosToUpdate.length > 0) {
      await this.todoRepo.saveMany(todosToUpdate);
    }

    return todos.map(todo => updateMap.get(todo.id) || todo);
  }

  async updateDescription(id: string, description: string): Promise<Todo> {
    const todo = await this.getOne(id);
    this.guardPastDueMutation(todo);
    return this.todoRepo.save({...todo, description});
  }

  async markDone(id: string): Promise<Todo> {
    const todo = await this.getOne(id);
    this.guardPastDueMutation(todo);
    return this.todoRepo.save({...todo, status: TodoStatus.DONE, doneDatetime: new Date()});
  }

  async markNotDone(id: string): Promise<Todo> {
    const todo = await this.getOne(id);
    this.guardPastDueMutation(todo);
    return this.todoRepo.save({...todo, status: TodoStatus.NOT_DONE, doneDatetime: null});
  }

  private guardPastDueMutation(todo: Todo): void {
    if (todo.status === TodoStatus.PAST_DUE) {
      throw new BadRequestException(`Todo ${todo.id} is past due and cannot be modified`);
    }
  }

  private async recalculatePastDue(todo: Todo): Promise<Todo> {
    if (todo.status === TodoStatus.NOT_DONE && new Date() > todo.dueDatetime) {
      return this.todoRepo.save({...todo, status: TodoStatus.PAST_DUE });
    }
    return todo;
  }
}