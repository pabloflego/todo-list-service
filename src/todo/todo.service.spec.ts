import { BadRequestException, NotFoundException } from '@nestjs/common';
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
    saveMany: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findBy: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockTodoRepository = {
      create: vi.fn(),
      save: vi.fn(),
      saveMany: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findBy: vi.fn(),
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
      const todo = { id, description: 'Test', status: TodoStatus.DONE, dueDatetime: new Date(Date.now() + 10000) } as Todo;

      mockTodoRepository.findById.mockResolvedValue(todo);

      const result = await service.getOne(id);

      expect(mockTodoRepository.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(todo);
    });

    it('should recalculate and update status to past due if overdue', async () => {
      const id = '1';
      const pastDate = new Date(Date.now() - 10000);
      const todo = { id, description: 'Test', status: TodoStatus.NOT_DONE, dueDatetime: pastDate } as Todo;
      const updatedTodo = { ...todo, status: TodoStatus.PAST_DUE } as Todo;

      mockTodoRepository.findById.mockResolvedValue(todo);
      mockTodoRepository.save.mockResolvedValue(updatedTodo);

      const result = await service.getOne(id);

      expect(mockTodoRepository.findById).toHaveBeenCalledWith(id);
      expect(mockTodoRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id,
        status: TodoStatus.PAST_DUE
      }));
      expect(result).toEqual(updatedTodo);
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
        { id: '1', description: 'Test 1', status: TodoStatus.DONE, dueDatetime: new Date(Date.now() + 10000) },
        { id: '2', description: 'Test 2', status: TodoStatus.NOT_DONE, dueDatetime: new Date(Date.now() + 10000) },
      ] as Todo[];

      mockTodoRepository.findAll.mockResolvedValue(todos);

      const result = await service.getAll();

      expect(mockTodoRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(todos);
    });

    it('should filter todos by status', async () => {
      const todos = [
        { id: '1', description: 'Test 1', status: TodoStatus.NOT_DONE, dueDatetime: new Date(Date.now() + 10000) },
      ] as Todo[];

      mockTodoRepository.findBy.mockResolvedValue(todos);

      const result = await service.getAll(TodoStatus.NOT_DONE);

      expect(mockTodoRepository.findBy).toHaveBeenCalledWith({ status: TodoStatus.NOT_DONE });
      expect(result).toEqual(todos);
    });

    it('should recalculate past due status for all todos', async () => {
      const pastDate = new Date(Date.now() - 10000);
      const todos = [
        { id: '1', description: 'Test 1', status: TodoStatus.NOT_DONE, dueDatetime: pastDate },
        { id: '2', description: 'Test 2', status: TodoStatus.DONE, dueDatetime: new Date(Date.now() + 10000) },
      ] as Todo[];

      mockTodoRepository.findAll.mockResolvedValue(todos);
      mockTodoRepository.saveMany.mockResolvedValue([{ ...todos[0], status: TodoStatus.PAST_DUE }]);

      const result = await service.getAll();

      expect(mockTodoRepository.saveMany).toHaveBeenCalledWith([
        expect.objectContaining({
          id: '1',
          status: TodoStatus.PAST_DUE
        })
      ]);
      expect(result[0].status).toBe(TodoStatus.PAST_DUE);
      expect(result[1]).toEqual(todos[1]);
    });

    it('should return updated todos with past due status in the result', async () => {
      const pastDate = new Date(Date.now() - 10000);
      const futureDate = new Date(Date.now() + 10000);
      const todos = [
        { id: '1', description: 'Overdue 1', status: TodoStatus.NOT_DONE, dueDatetime: pastDate },
        { id: '2', description: 'Overdue 2', status: TodoStatus.NOT_DONE, dueDatetime: pastDate },
        { id: '3', description: 'Not overdue', status: TodoStatus.NOT_DONE, dueDatetime: futureDate },
        { id: '4', description: 'Done', status: TodoStatus.DONE, dueDatetime: pastDate },
      ] as Todo[];

      mockTodoRepository.findAll.mockResolvedValue(todos);
      mockTodoRepository.saveMany.mockResolvedValue([
        { ...todos[0], status: TodoStatus.PAST_DUE },
        { ...todos[1], status: TodoStatus.PAST_DUE }
      ]);

      const result = await service.getAll();

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ ...todos[0], status: TodoStatus.PAST_DUE });
      expect(result[1]).toEqual({ ...todos[1], status: TodoStatus.PAST_DUE });
      expect(result[2]).toEqual(todos[2]);
      expect(result[3]).toEqual(todos[3]);
    });
  });

  describe('updateDescription', () => {
    it('should update todo description', async () => {
      const id = '1';
      const newDescription = 'Updated Description';
      const todo = { id, description: 'Old Description', status: TodoStatus.NOT_DONE, dueDatetime: new Date(Date.now() + 10000) } as Todo;
      const updatedTodo = { ...todo, description: newDescription } as Todo;

      mockTodoRepository.findById.mockResolvedValue(todo);
      mockTodoRepository.save.mockResolvedValue(updatedTodo);

      const result = await service.updateDescription(id, newDescription);

      expect(mockTodoRepository.findById).toHaveBeenCalledWith(id);
      expect(mockTodoRepository.save).toHaveBeenCalledWith({ ...todo, description: newDescription });
      expect(result).toEqual(updatedTodo);
    });

    it('should throw BadRequestException when todo is past due', async () => {
      const id = '1';
      const newDescription = 'Updated';
      const todo = { id, description: 'Old', status: TodoStatus.PAST_DUE, dueDatetime: new Date(Date.now() + 10000) } as Todo;

      mockTodoRepository.findById.mockResolvedValue(todo);

      await expect(service.updateDescription(id, newDescription)).rejects.toThrow(BadRequestException);
      await expect(service.updateDescription(id, newDescription)).rejects.toThrow(`Todo ${id} is past due and cannot be modified`);
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
      const todo = { id, status: TodoStatus.NOT_DONE, dueDatetime: new Date(Date.now() + 10000) } as Todo;
      const doneTodo = { ...todo, status: TodoStatus.DONE, doneDatetime: expect.any(Date) } as Todo;

      mockTodoRepository.findById.mockResolvedValue(todo);
      mockTodoRepository.save.mockResolvedValue(doneTodo);

      const result = await service.markDone(id);

      expect(mockTodoRepository.findById).toHaveBeenCalledWith(id);
      expect(mockTodoRepository.save).toHaveBeenCalledWith({
        ...todo,
        status: TodoStatus.DONE,
        doneDatetime: expect.any(Date)
      });
      expect(result).toEqual(doneTodo);
    });

    it('should throw BadRequestException when todo is past due', async () => {
      const id = '1';
      const todo = { id, status: TodoStatus.PAST_DUE, dueDatetime: new Date(Date.now() + 10000) } as Todo;

      mockTodoRepository.findById.mockResolvedValue(todo);

      await expect(service.markDone(id)).rejects.toThrow(BadRequestException);
      await expect(service.markDone(id)).rejects.toThrow(`Todo ${id} is past due and cannot be modified`);
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
      const todo = { id, status: TodoStatus.DONE, doneDatetime: new Date(), dueDatetime: new Date(Date.now() + 10000) } as Todo;
      const notDoneTodo = { ...todo, status: TodoStatus.NOT_DONE, doneDatetime: null } as Todo;

      mockTodoRepository.findById.mockResolvedValue(todo);
      mockTodoRepository.save.mockResolvedValue(notDoneTodo);

      const result = await service.markNotDone(id);

      expect(mockTodoRepository.findById).toHaveBeenCalledWith(id);
      expect(mockTodoRepository.save).toHaveBeenCalledWith({
        ...todo,
        status: TodoStatus.NOT_DONE,
        doneDatetime: null
      });
      expect(result).toEqual(notDoneTodo);
    });

    it('should throw BadRequestException when todo is past due', async () => {
      const id = '1';
      const todo = { id, status: TodoStatus.PAST_DUE, dueDatetime: new Date(Date.now() + 10000) } as Todo;

      mockTodoRepository.findById.mockResolvedValue(todo);

      await expect(service.markNotDone(id)).rejects.toThrow(BadRequestException);
      await expect(service.markNotDone(id)).rejects.toThrow(`Todo ${id} is past due and cannot be modified`);
    });

    it('should throw NotFoundException when todo not found', async () => {
      const id = '1';

      mockTodoRepository.findById.mockResolvedValue(null);

      await expect(service.markNotDone(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('runPastDueSweep', () => {
    it('should flip overdue NOT_DONE todos to PAST_DUE', async () => {
      const pastDate = new Date(Date.now() - 10000);
      const overdueTodos = [
        { id: '1', status: TodoStatus.NOT_DONE, dueDatetime: pastDate } as Todo,
        { id: '2', status: TodoStatus.NOT_DONE, dueDatetime: pastDate } as Todo,
      ];

      mockTodoRepository.findBy.mockResolvedValue(overdueTodos);
      mockTodoRepository.saveMany.mockResolvedValue([
        { ...overdueTodos[0], status: TodoStatus.PAST_DUE },
        { ...overdueTodos[1], status: TodoStatus.PAST_DUE },
      ]);

      const updatedCount = await service.runPastDueSweep();

      expect(mockTodoRepository.findBy).toHaveBeenCalledWith(expect.objectContaining({
        status: TodoStatus.NOT_DONE,
        dueDatetime: expect.anything(),
      }));
      expect(mockTodoRepository.saveMany).toHaveBeenCalledWith([
        { ...overdueTodos[0], status: TodoStatus.PAST_DUE },
        { ...overdueTodos[1], status: TodoStatus.PAST_DUE },
      ]);
      expect(updatedCount).toBe(2);
    });

    it('should be idempotent when no overdue todos are found', async () => {
      mockTodoRepository.findBy.mockResolvedValue([]);

      const updatedCount = await service.runPastDueSweep();

      expect(updatedCount).toBe(0);
      expect(mockTodoRepository.saveMany).not.toHaveBeenCalled();
    });
  });
});
