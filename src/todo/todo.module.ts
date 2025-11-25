import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from './todo.entity';
import { TodoRepository } from './todo.repository';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Todo])],
  providers: [TodoRepository, TodoService],
  controllers: [TodoController],
})
export class TodoModule {}
