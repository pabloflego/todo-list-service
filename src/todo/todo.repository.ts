import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, FindOptionsWhere } from 'typeorm';
import { Todo } from './todo.entity';

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

  findBy(predicate: FindOptionsWhere<Todo>): Promise<Todo[]> {
    return this.repo.find({ where: predicate });
  }
}
