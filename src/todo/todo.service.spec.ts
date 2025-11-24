import { NotFoundException } from '@nestjs/common';
import { TodoService } from './todo.service';
import { TodoRepository } from './todo.repository';
import { Todo } from './todo.entity';
import { TodoStatus } from './todo-status.enum';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('TodoService', () => {
  let service: TodoService;
  let mockTodoRepository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    setStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockTodoRepository = {
      create: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      setStatus: vi.fn(),
    };

    service = new TodoService(mockTodoRepository as unknown as TodoRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('add', () => {
    it('should create and save a new todo', async () => {
      const description = 'Test Todo';
      const dueDatetime = new Date();
      const todo = { id: '1', description, dueDatetime } as Todo;

      mockTodoRepository.create.mockReturnValue(todo);
      mockTodoRepository.save.mockResolvedValue(todo);

      const result = await service.add(description, dueDatetime);

      expect(mockTodoRepository.create).toHaveBeenCalledWith(description, dueDatetime);
      expect(mockTodoRepository.save).toHaveBeenCalledWith(todo);
      expect(result).toEqual(todo);
    });
  });

  describe('getOne', () => {
    it('should return a todo by id', async () => {
      const id = '1';
      const todo = { id, description: 'Test' } as Todo;

      mockTodoRepository.findById.mockResolvedValue(todo);

      const result = await service.getOne(id);

      expect(mockTodoRepository.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(todo);
    });

    it('should throw NotFoundException when todo not found', async () => {
      const id = '1';

      mockTodoRepository.findById.mockResolvedValue(null);

      await expect(service.getOne(id)).rejects.toThrow(NotFoundException);
      await expect(service.getOne(id)).rejects.toThrow(`Todo ${id} not found`);
    });
  });

  describe('getAll', () => {
    it('should return all todos', async () => {
      const todos = [
        { id: '1', description: 'Test 1' },
        { id: '2', description: 'Test 2' },
      ] as Todo[];

      mockTodoRepository.findAll.mockResolvedValue(todos);

      const result = await service.getAll();

      expect(mockTodoRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(todos);
    });
  });

  describe('updateDescription', () => {
    it('should update todo description', async () => {
      const id = '1';
      const newDescription = 'Updated Description';
      const todo = { id, description: 'Old Description' } as Todo;
      const updatedTodo = { ...todo, description: newDescription } as Todo;

      mockTodoRepository.findById.mockResolvedValue(todo);
      mockTodoRepository.save.mockResolvedValue(updatedTodo);

      const result = await service.updateDescription(id, newDescription);

      expect(mockTodoRepository.findById).toHaveBeenCalledWith(id);
      expect(todo.description).toBe(newDescription);
      expect(mockTodoRepository.save).toHaveBeenCalledWith(todo);
      expect(result).toEqual(updatedTodo);
    });

    it('should throw NotFoundException when todo not found', async () => {
      const id = '1';
      const newDescription = 'Updated';

      mockTodoRepository.findById.mockResolvedValue(null);

      await expect(service.updateDescription(id, newDescription)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markDone', () => {
    it('should mark todo as done with current datetime', async () => {
      const id = '1';
      const todo = { id, status: TodoStatus.NOT_DONE } as Todo;
      const doneTodo = { ...todo, status: TodoStatus.DONE, doneDatetime: expect.any(Date) } as Todo;

      mockTodoRepository.findById.mockResolvedValue(todo);
      mockTodoRepository.setStatus.mockResolvedValue(doneTodo);

      const result = await service.markDone(id);

      expect(mockTodoRepository.findById).toHaveBeenCalledWith(id);
      expect(mockTodoRepository.setStatus).toHaveBeenCalledWith(todo, TodoStatus.DONE, expect.any(Date));
      expect(result).toEqual(doneTodo);
    });

    it('should throw NotFoundException when todo not found', async () => {
      const id = '1';

      mockTodoRepository.findById.mockResolvedValue(null);

      await expect(service.markDone(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('markNotDone', () => {
    it('should mark todo as not done with null doneDatetime', async () => {
      const id = '1';
      const todo = { id, status: TodoStatus.DONE, doneDatetime: new Date() } as Todo;
      const notDoneTodo = { ...todo, status: TodoStatus.NOT_DONE, doneDatetime: null } as Todo;

      mockTodoRepository.findById.mockResolvedValue(todo);
      mockTodoRepository.setStatus.mockResolvedValue(notDoneTodo);

      const result = await service.markNotDone(id);

      expect(mockTodoRepository.findById).toHaveBeenCalledWith(id);
      expect(mockTodoRepository.setStatus).toHaveBeenCalledWith(todo, TodoStatus.NOT_DONE, null);
      expect(result).toEqual(notDoneTodo);
    });

    it('should throw NotFoundException when todo not found', async () => {
      const id = '1';

      mockTodoRepository.findById.mockResolvedValue(null);

      await expect(service.markNotDone(id)).rejects.toThrow(NotFoundException);
    });
  });
});
