import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from './todo.entity';
import { TodoRepository } from './todo.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Todo])],
  providers: [TodoRepository],
  controllers: [],
})
export class TodoModule {}
