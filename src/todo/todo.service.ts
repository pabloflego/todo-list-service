import { Injectable, NotFoundException } from '@nestjs/common';
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
    return todo;
  }

  async getAll(): Promise<Todo[]> {
    const todos = await this.todoRepo.findAll() ;
    return todos;
  }

  async updateDescription(id: string, description: string): Promise<Todo> {
    const todo = await this.getOne(id);
    todo.description = description;
    return this.todoRepo.save(todo);
  }

  async markDone(id: string): Promise<Todo> {
    const todo = await this.getOne(id);
    return this.todoRepo.setStatus(todo, TodoStatus.DONE, new Date());
  }

  async markNotDone(id: string): Promise<Todo> {
    const todo = await this.getOne(id);
    return this.todoRepo.setStatus(todo, TodoStatus.NOT_DONE, null);
  }
}
