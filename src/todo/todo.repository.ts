import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Todo } from './todo.entity';
import { TodoStatus } from './todo-status.enum';

@Injectable()
export class TodoRepository {
  constructor(
    @InjectRepository(Todo)
    private readonly repo: Repository<Todo>,
  ) {}

  create(description: string, dueDatetime: Date): Todo {
    return this.repo.create({ description, dueDatetime });
  }

  save(todo: Todo): Promise<Todo> {
    return this.repo.save(todo);
  }

  findById(id: string): Promise<Todo | null> {
    return this.repo.findOne({ where: { id } });
  }

  findAll(): Promise<Todo[]> {
    return this.repo.find();
  }

  findByStatus(status: TodoStatus): Promise<Todo[]> {
    return this.repo.find({ where: { status } });
  }

  async setStatus(todo: Todo, status: TodoStatus, doneDatetime?: Date | null): Promise<Todo> {
    todo.status = status;
    todo.doneDatetime = doneDatetime ?? null;
    return this.save(todo);
  }
}
