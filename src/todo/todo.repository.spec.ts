import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoRepository } from './todo.repository';
import { Todo } from './todo.entity';
import { TodoStatus } from './todo-status.enum';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('TodoRepository', () => {
  let repository: TodoRepository;
  let typeOrmRepository: Repository<Todo>;

  const mockTypeOrmRepository = {
    create: vi.fn(),
    save: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoRepository,
        {
          provide: getRepositoryToken(Todo),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<TodoRepository>(TodoRepository);
    typeOrmRepository = module.get<Repository<Todo>>(getRepositoryToken(Todo));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a todo instance', () => {
      const description = 'Test Todo';
      const dueDatetime = new Date();
      const expectedTodo = { description, dueDatetime, status: TodoStatus.NOT_DONE } as Todo;
      
      mockTypeOrmRepository.create.mockReturnValue(expectedTodo);

      const result = repository.create(description, dueDatetime);

      expect(mockTypeOrmRepository.create).toHaveBeenCalledWith({ description, dueDatetime, status: TodoStatus.NOT_DONE });
      expect(result).toEqual(expectedTodo);
    });
  });

  describe('save', () => {
    it('should save a todo', async () => {
      const todo = { id: '1', description: 'Test' } as Todo;
      mockTypeOrmRepository.save.mockResolvedValue(todo);

      const result = await repository.save(todo);

      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(todo);
      expect(result).toEqual(todo);
    });

    it('should save multiple todos', async () => {
      const todos = [
        { id: '1', description: 'Test 1' } as Todo,
        { id: '2', description: 'Test 2' } as Todo,
      ];
      mockTypeOrmRepository.save.mockResolvedValue(todos);

      const result = await repository.save(todos);

      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(todos);
      expect(result).toEqual(todos);
    });
  });

  describe('findById', () => {
    it('should find a todo by id', async () => {
      const id = '1';
      const todo = { id, description: 'Test' } as Todo;
      mockTypeOrmRepository.findOne.mockResolvedValue(todo);

      const result = await repository.findById(id);

      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(todo);
    });

    it('should return null if todo not found', async () => {
      const id = '1';
      mockTypeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById(id);

      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({ where: { id } });
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all todos', async () => {
      const todos = [{ id: '1' }] as Todo[];
      mockTypeOrmRepository.find.mockResolvedValue(todos);

      const result = await repository.findAll();

      expect(mockTypeOrmRepository.find).toHaveBeenCalled();
      expect(result).toEqual(todos);
    });
  });

  describe('findBy', () => {
    it('should find todos with empty predicate (all)', async () => {
      const todos = [{ id: '1' }] as Todo[];
      mockTypeOrmRepository.find.mockResolvedValue(todos);

      const result = await repository.findBy({});

      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual(todos);
    });

    it('should find todos by status', async () => {
      const status = TodoStatus.NOT_DONE;
      const todos = [{ id: '1', status }] as Todo[];
      mockTypeOrmRepository.find.mockResolvedValue(todos);

      const result = await repository.findBy({ status });

      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({ where: { status } });
      expect(result).toEqual(todos);
    });

    it('should find todos by multiple criteria', async () => {
      const status = TodoStatus.DONE;
      const id = '1';
      const todos = [{ id, status }] as Todo[];
      mockTypeOrmRepository.find.mockResolvedValue(todos);

      const result = await repository.findBy({ id, status });

      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({ where: { id, status } });
      expect(result).toEqual(todos);
    });
  });
});
