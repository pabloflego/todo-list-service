import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import { Todo } from './todo.entity';
import { TodoStatus } from './todo-status.enum';

class CreateTodoDto {
  description: string;
  dueDatetime: string;
}

class UpdateDescriptionDto {
  description: string;
}

@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTodoDto: CreateTodoDto): Promise<Todo> {
    return this.todoService.add(
      createTodoDto.description,
      new Date(createTodoDto.dueDatetime),
    );
  }

  @Get()
  async findAll(@Query('status') status?: TodoStatus): Promise<Todo[]> {
    return this.todoService.getAll(status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Todo> {
    return this.todoService.getOne(id);
  }

  @Patch(':id/description')
  async updateDescription(
    @Param('id') id: string,
    @Body() updateDescriptionDto: UpdateDescriptionDto,
  ): Promise<Todo> {
    return this.todoService.updateDescription(id, updateDescriptionDto.description);
  }

  @Patch(':id/mark-done')
  @HttpCode(HttpStatus.OK)
  async markDone(@Param('id') id: string): Promise<Todo> {
    return this.todoService.markDone(id);
  }

  @Patch(':id/mark-not-done')
  @HttpCode(HttpStatus.OK)
  async markNotDone(@Param('id') id: string): Promise<Todo> {
    return this.todoService.markNotDone(id);
  }
}
