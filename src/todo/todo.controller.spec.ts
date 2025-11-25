import 'reflect-metadata';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';
import { Todo } from './todo.entity';
import { TodoStatus } from './todo-status.enum';
import { NotFoundException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('TodoController', () => {
  let controller: TodoController;
  let mockTodoService: {
    add: ReturnType<typeof vi.fn>;
    getOne: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    updateDescription: ReturnType<typeof vi.fn>;
    markDone: ReturnType<typeof vi.fn>;
    markNotDone: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockTodoService = {
      add: vi.fn(),
      getOne: vi.fn(),
      getAll: vi.fn(),
      updateDescription: vi.fn(),
      markDone: vi.fn(),
      markNotDone: vi.fn(),
    };

    controller = new TodoController(mockTodoService as unknown as TodoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new todo', async () => {
      const createTodoDto = {
        description: 'Test Todo',
        dueDatetime: new Date('2025-12-31').toISOString(),
      };
      const todo = {
        id: '1',
        description: createTodoDto.description,
        dueDatetime: new Date(createTodoDto.dueDatetime),
        status: TodoStatus.NOT_DONE,
      } as Todo;

      mockTodoService.add.mockResolvedValue(todo);

      const result = await controller.create(createTodoDto);

      expect(mockTodoService.add).toHaveBeenCalledWith(
        createTodoDto.description,
        expect.any(Date),
      );
      expect(result).toEqual(todo);
    });
  });

  describe('findAll', () => {
    it('should return all todos', async () => {
      const todos = [
        { id: '1', description: 'Test 1' },
        { id: '2', description: 'Test 2' },
      ] as Todo[];

      mockTodoService.getAll.mockResolvedValue(todos);

      const result = await controller.findAll();

      expect(mockTodoService.getAll).toHaveBeenCalled();
      expect(result).toEqual(todos);
    });
  });

  describe('findOne', () => {
    it('should return a todo by id', async () => {
      const id = '1';
      const todo = { id, description: 'Test' } as Todo;

      mockTodoService.getOne.mockResolvedValue(todo);

      const result = await controller.findOne(id);

      expect(mockTodoService.getOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(todo);
    });

    it('should throw NotFoundException when todo not found', async () => {
      const id = '1';

      mockTodoService.getOne.mockRejectedValue(new NotFoundException(`Todo ${id} not found`));

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDescription', () => {
    it('should update todo description', async () => {
      const id = '1';
      const updateDescriptionDto = { description: 'Updated Description' };
      const updatedTodo = { id, description: updateDescriptionDto.description } as Todo;

      mockTodoService.updateDescription.mockResolvedValue(updatedTodo);

      const result = await controller.updateDescription(id, updateDescriptionDto);

      expect(mockTodoService.updateDescription).toHaveBeenCalledWith(id, updateDescriptionDto.description);
      expect(result).toEqual(updatedTodo);
    });

    it('should throw NotFoundException when todo not found', async () => {
      const id = '1';
      const updateDescriptionDto = { description: 'Updated' };

      mockTodoService.updateDescription.mockRejectedValue(new NotFoundException(`Todo ${id} not found`));

      await expect(controller.updateDescription(id, updateDescriptionDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markDone', () => {
    it('should mark todo as done', async () => {
      const id = '1';
      const todo = { id, status: TodoStatus.DONE, doneDatetime: new Date() } as Todo;

      mockTodoService.markDone.mockResolvedValue(todo);

      const result = await controller.markDone(id);

      expect(mockTodoService.markDone).toHaveBeenCalledWith(id);
      expect(result).toEqual(todo);
    });

    it('should throw NotFoundException when todo not found', async () => {
      const id = '1';

      mockTodoService.markDone.mockRejectedValue(new NotFoundException(`Todo ${id} not found`));

      await expect(controller.markDone(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markNotDone', () => {
    it('should mark todo as not done', async () => {
      const id = '1';
      const todo = { id, status: TodoStatus.NOT_DONE, doneDatetime: null } as Todo;

      mockTodoService.markNotDone.mockResolvedValue(todo);

      const result = await controller.markNotDone(id);

      expect(mockTodoService.markNotDone).toHaveBeenCalledWith(id);
      expect(result).toEqual(todo);
    });

    it('should throw NotFoundException when todo not found', async () => {
      const id = '1';

      mockTodoService.markNotDone.mockRejectedValue(new NotFoundException(`Todo ${id} not found`));

      await expect(controller.markNotDone(id)).rejects.toThrow(NotFoundException);
    });
  });
});
