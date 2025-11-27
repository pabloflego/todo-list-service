import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { LessThan } from 'typeorm';
import { TodoRepository } from './todo.repository';
import { TodoStatus } from './todo-status.enum';
import { Todo } from './todo.entity';

@Injectable()
export class TodoService implements OnModuleInit, OnModuleDestroy {
  private pastDueSweepTimer: NodeJS.Timeout | null = null;
  private static readonly PAST_DUE_SWEEP_INTERVAL_MS = 60_000;
  private readonly logger = new Logger(TodoService.name);

  constructor(private readonly todoRepo: TodoRepository) {}

  onModuleInit(): void {
    if (this.pastDueSweepTimer) return;

    this.pastDueSweepTimer = setInterval(() => {
      void this.runPastDueSweep().catch((err) => {
        this.logger.error('Past-due sweep failed', err.stack);
      });
    }, TodoService.PAST_DUE_SWEEP_INTERVAL_MS);

    this.pastDueSweepTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (!this.pastDueSweepTimer) return;
    clearInterval(this.pastDueSweepTimer);
    this.pastDueSweepTimer = null;
  }

  async add(description: string, dueDatetime: Date): Promise<Todo> {
    this.ensureValidDate(dueDatetime, 'dueDatetime');
    const todo = this.todoRepo.create(description, dueDatetime);
    try {
      return await this.todoRepo.save(todo);
    } catch (err) {
      this.logger.error(`Failed to add todo "${description}"`, err instanceof Error ? err.stack : undefined);
      throw err;
    }
  }

  async getOne(id: string): Promise<Todo> {
    const todo = await this.todoRepo.findById(id);
    if (!todo) {
      this.logger.debug(`Todo ${id} not found`);
      throw new NotFoundException(`Todo ${id} not found`);
    }
    return this.applyPastDue(todo);
  }

  async getAll(includeAll?: boolean): Promise<Todo[]> {
    const todos = includeAll
      ? await this.todoRepo.findAll()
      : await this.todoRepo.findBy({ status: TodoStatus.NOT_DONE });

    return this.applyPastDue(todos);
  }

  async updateDescription(id: string, description: string): Promise<Todo> {
    const todo = await this.getOne(id);
    this.guardPastDueMutation(todo);
    try {
      return await this.todoRepo.save({ ...todo, description });
    } catch (err) {
      this.logger.error(`Failed to update description for todo ${id}`, err instanceof Error ? err.stack : undefined);
      throw err;
    }
  }

  async markDone(id: string): Promise<Todo> {
    const todo = await this.getOne(id);
    this.guardPastDueMutation(todo);
    try {
      return await this.todoRepo.save({ ...todo, status: TodoStatus.DONE, doneDatetime: new Date() });
    } catch (err) {
      this.logger.error(`Failed to mark todo ${id} as done`, err instanceof Error ? err.stack : undefined);
      throw err;
    }
  }

  async markNotDone(id: string): Promise<Todo> {
    const todo = await this.getOne(id);
    this.guardPastDueMutation(todo);
    try {
      return await this.todoRepo.save({ ...todo, status: TodoStatus.NOT_DONE, doneDatetime: null });
    } catch (err) {
      this.logger.error(`Failed to mark todo ${id} as not done`, err instanceof Error ? err.stack : undefined);
      throw err;
    }
  }

  private async applyPastDue(todo: Todo): Promise<Todo>;
  private async applyPastDue(todos: Todo[]): Promise<Todo[]>;
  private async applyPastDue(todos: Todo | Todo[]): Promise<Todo | Todo[]> {
    const now = new Date();
    const isSingle = !Array.isArray(todos);
    const todosToUpdate: Todo[] = [];
    const updateMap = new Map<string, Todo>();

    const list = isSingle ? [todos] : todos;
    for (const todo of list) {
      if (todo.status === TodoStatus.NOT_DONE && now > todo.dueDatetime) {
        const updatedTodo = { ...todo, status: TodoStatus.PAST_DUE };
        todosToUpdate.push(updatedTodo);
        updateMap.set(todo.id, updatedTodo);
      }
    }

    if (todosToUpdate.length > 0) {
      await this.todoRepo.save(todosToUpdate);
    }

    const result = list.map(todo => updateMap.get(todo.id) || todo);
    return isSingle ? result[0] : result;
  }

  private guardPastDueMutation(todo: Todo): void {
    if (todo.status === TodoStatus.PAST_DUE) {
      this.logger.debug(`Mutation blocked for past-due todo ${todo.id}`);
      throw new BadRequestException(`Todo ${todo.id} is past due and cannot be modified`);
    }
  }

  private ensureValidDate(date: Date, field: string): void {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${field}`);
    }
  }

  async runPastDueSweep(now: Date = new Date()): Promise<number> {
    const overdueTodos = await this.todoRepo.findBy({
      status: TodoStatus.NOT_DONE,
      dueDatetime: LessThan(now),
    });

    if (overdueTodos.length === 0) {
      this.logger.debug('Past-due sweep ran, 0 updates');
      return 0;
    }

    const updatedTodos = overdueTodos.map(todo => ({ ...todo, status: TodoStatus.PAST_DUE }));
    await this.todoRepo.save(updatedTodos);
    const updatedCount = updatedTodos.length;
    this.logger.debug(`Past-due sweep updated ${updatedCount} todo(s)`);
    return updatedCount;
  }
}
