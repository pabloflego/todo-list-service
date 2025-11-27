import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, FindOptionsWhere } from 'typeorm';
import { Todo } from './todo.entity';
import { TodoStatus } from './todo-status.enum';

@Injectable()
export class TodoRepository {
  constructor(
    @InjectRepository(Todo)
    private readonly repo: Repository<Todo>,
  ) {}

  create(description: string, dueDatetime: Date): Todo {
    return this.repo.create({ description, dueDatetime, status: TodoStatus.NOT_DONE });
  }

  save(todo: Todo): Promise<Todo>;
  save(todos: Todo[]): Promise<Todo[]>;
  save(todoOrTodos: Todo | Todo[]): Promise<Todo | Todo[]> {
    if (Array.isArray(todoOrTodos)) {
      return this.repo.save(todoOrTodos);
    }
    return this.repo.save(todoOrTodos);
  }

  findById(id: string): Promise<Todo | null> {
    return this.repo.findOne({ where: { id } });
  }

  findAll(): Promise<Todo[]> {
    return this.repo.find();
  }

  findBy(predicate: FindOptionsWhere<Todo>): Promise<Todo[]> {
    return this.repo.find({ where: predicate });
  }
}
