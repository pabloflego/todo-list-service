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
import { ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';
import { TodoService } from './todo.service';
import { Todo } from './todo.entity';
import { TodoStatus } from './todo-status.enum';

class CreateTodoDto {
  @ApiProperty({ example: 'Buy groceries' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: new Date(Date.now() + 86_400_000).toISOString(),
    description: 'ISO8601 timestamp for when the todo is due',
  })
  @IsDateString()
  dueDatetime: string;
}

class UpdateDescriptionDto {
  @ApiProperty({ example: 'Buy groceries and fruit' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

@Controller('todos')
@ApiTags('todos')
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
  @ApiQuery({ name: 'status', enum: TodoStatus, required: false })
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
