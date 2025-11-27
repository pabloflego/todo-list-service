import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TodoStatus } from '../src/todo/todo-status.enum';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { requestLogger } from '../src/common/request-logger.middleware';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { DataSource } from 'typeorm';

describe('Todo REST API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const getFutureDate = () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    return futureDate;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(requestLogger(new Logger('HTTP')));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    const httpAdapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(new HttpExceptionFilter(httpAdapterHost));
    dataSource = app.get(DataSource);
    await app.init();
  });

  afterEach(async () => {
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return ok with db up', async () => {
      const res = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(res.body).toEqual({ status: 'ok', db: 'up' });
    });
  });

  describe('/todos (POST)', () => {
    it('should create a new todo', async () => {
      const createTodoDto = {
        description: 'Buy groceries',
        dueDatetime: getFutureDate().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/todos')
        .send(createTodoDto)
        .expect(201);

      expect(response.body).toMatchObject({
        description: createTodoDto.description,
        status: TodoStatus.NOT_DONE,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.creationDatetime).toBeDefined();
    });

    it('should validate request body and return 400 with error shape', async () => {
      const response = await request(app.getHttpServer())
        .post('/todos')
        .send({
          description: '',
          dueDatetime: 'not-a-date',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(Array.isArray(response.body.message)).toBe(true);
      expect(response.body.path).toBe('/todos');
      expect(response.body.method).toBe('POST');
      expect(response.body.requestId).toBeDefined();
    });
  });

  describe('/todos (GET)', () => {
    it('should return only NOT_DONE todos by default', async () => {
      const notDoneResponse = await request(app.getHttpServer())
        .post('/todos')
        .send({
          description: 'Active task default filter',
          dueDatetime: getFutureDate().toISOString(),
        });

      const doneTodo = await request(app.getHttpServer())
        .post('/todos')
        .send({
          description: 'Completed task default filter',
          dueDatetime: getFutureDate().toISOString(),
        });

      await request(app.getHttpServer())
        .patch(`/todos/${doneTodo.body.id}/mark-done`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/todos')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body.every((t: any) => t.status === TodoStatus.NOT_DONE)).toBe(true);
      expect(response.body.find((t: any) => t.id === doneTodo.body.id)).toBeUndefined();
      expect(response.body.find((t: any) => t.id === notDoneResponse.body.id)).toBeDefined();
    });

    it('should return all todos when all=true', async () => {
      const activeTodo = await request(app.getHttpServer())
        .post('/todos')
        .send({
          description: 'Active task include all',
          dueDatetime: getFutureDate().toISOString(),
        });

      const doneTodo = await request(app.getHttpServer())
        .post('/todos')
        .send({
          description: 'Completed task include all',
          dueDatetime: getFutureDate().toISOString(),
        });

      await request(app.getHttpServer())
        .patch(`/todos/${doneTodo.body.id}/mark-done`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/todos')
        .query({ all: true })
        .expect(200);

      const ids = response.body.map((t: any) => t.id);
      expect(ids).toEqual(expect.arrayContaining([activeTodo.body.id, doneTodo.body.id]));
      expect(response.body.some((t: any) => t.status === TodoStatus.NOT_DONE)).toBe(true);
      expect(response.body.some((t: any) => t.status === TodoStatus.DONE)).toBe(true);
    });
  });

  describe('/todos/:id (GET)', () => {
    it('should return a specific todo', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/todos')
        .send({
          description: 'Test todo',
          dueDatetime: getFutureDate().toISOString(),
        });

      const todoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/todos/${todoId}`)
        .expect(200);

      expect(response.body.id).toBe(todoId);
      expect(response.body.description).toBe('Test todo');
    });

    it('should return 404 for non-existent todo', async () => {
      await request(app.getHttpServer())
        .get('/todos/non-existent-id')
        .expect(404);
    });
  });

  describe('/todos/:id/description (PATCH)', () => {
    it('should update todo description', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/todos')
        .send({
          description: 'Original description',
          dueDatetime: getFutureDate().toISOString(),
        });

      const todoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/todos/${todoId}/description`)
        .send({ description: 'Updated description' })
        .expect(200);

      expect(response.body.description).toBe('Updated description');
    });

    it('should return 404 for non-existent todo', async () => {
      await request(app.getHttpServer())
        .patch('/todos/non-existent-id/description')
        .send({ description: 'Updated' })
        .expect(404);
    });
  });

  describe('/todos/:id/mark-done (PATCH)', () => {
    it('should mark todo as done', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/todos')
        .send({
          description: 'Todo to mark done',
          dueDatetime: getFutureDate().toISOString(),
        });

      const todoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/todos/${todoId}/mark-done`)
        .expect(200);

      expect(response.body.status).toBe(TodoStatus.DONE);
      expect(response.body.doneDatetime).toBeDefined();
      expect(response.body.doneDatetime).not.toBeNull();
    });

    it('should return 404 for non-existent todo', async () => {
      await request(app.getHttpServer())
        .patch('/todos/non-existent-id/mark-done')
        .expect(404);
    });
  });

  describe('/todos/:id/mark-not-done (PATCH)', () => {
    it('should mark todo as not done', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/todos')
        .send({
          description: 'Todo to mark not done',
          dueDatetime: getFutureDate().toISOString(),
        });

      const todoId = createResponse.body.id;

      await request(app.getHttpServer())
        .patch(`/todos/${todoId}/mark-done`);

      const response = await request(app.getHttpServer())
        .patch(`/todos/${todoId}/mark-not-done`)
        .expect(200);

      expect(response.body.status).toBe(TodoStatus.NOT_DONE);
      expect(response.body.doneDatetime).toBeNull();
    });

    it('should return 404 for non-existent todo', async () => {
      await request(app.getHttpServer())
        .patch('/todos/non-existent-id/mark-not-done')
        .expect(404);
    });
  });

  describe('Business Rules', () => {
    it('should create, update, mark done and reopen todo', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/todos')
        .send({
          description: 'Complete project',
          dueDatetime: getFutureDate().toISOString(),
        })
        .expect(201);

      const todoId = createResponse.body.id;
      expect(createResponse.body.status).toBe(TodoStatus.NOT_DONE);

      const updateResponse = await request(app.getHttpServer())
        .patch(`/todos/${todoId}/description`)
        .send({ description: 'Complete big project' })
        .expect(200);

      expect(updateResponse.body.description).toBe('Complete big project');

      const doneResponse = await request(app.getHttpServer())
        .patch(`/todos/${todoId}/mark-done`)
        .expect(200);

      expect(doneResponse.body.status).toBe(TodoStatus.DONE);

      const notDoneResponse = await request(app.getHttpServer())
        .patch(`/todos/${todoId}/mark-not-done`)
        .expect(200);

      expect(notDoneResponse.body.status).toBe(TodoStatus.NOT_DONE);

      const getResponse = await request(app.getHttpServer())
        .get(`/todos/${todoId}`)
        .expect(200);

      expect(getResponse.body).toMatchObject({
        id: todoId,
        description: 'Complete big project',
        status: TodoStatus.NOT_DONE,
        doneDatetime: null,
      });
    });

    it('should automatically transition to PAST_DUE when overdue', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const createResponse = await request(app.getHttpServer())
        .post('/todos')
        .send({
          description: 'Overdue task',
          dueDatetime: pastDate.toISOString(),
        })
        .expect(201);

      const todoId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/todos/${todoId}`)
        .expect(200);

      expect(response.body.status).toBe(TodoStatus.PAST_DUE);
    });

    it('should prevent modification of PAST_DUE todos', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const createResponse = await request(app.getHttpServer())
        .post('/todos')
        .send({
          description: 'Immutable task',
          dueDatetime: pastDate.toISOString(),
        })
        .expect(201);

      const todoId = createResponse.body.id;

      await request(app.getHttpServer())
        .patch(`/todos/${todoId}/description`)
        .send({ description: 'New description' })
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/todos/${todoId}/mark-done`)
        .expect(400);

      await request(app.getHttpServer())
        .patch(`/todos/${todoId}/mark-not-done`)
        .expect(400);
    });
  });
});
