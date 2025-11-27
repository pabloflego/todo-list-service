import { ArgumentsHost, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';
import { HttpExceptionFilter } from './http-exception.filter';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('HttpExceptionFilter', () => {
  let httpAdapterHost: HttpAdapterHost;
  const reply = vi.fn();
  const request = {
    method: 'GET',
    url: '/todos/123',
    requestId: 'req-1',
  };
  const response = {};

  const createArgsHost = (): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    }) as unknown as ArgumentsHost;

  beforeEach(() => {
    vi.clearAllMocks();
    httpAdapterHost = {
      httpAdapter: {
        getRequestUrl: (req: any) => req.url,
        reply,
      },
    } as unknown as HttpAdapterHost;
  });

  it('should format HttpExceptions with message and status', () => {
    const filter = new HttpExceptionFilter(httpAdapterHost);
    const exception = new NotFoundException('Todo not found');

    filter.catch(exception, createArgsHost());

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        statusCode: 404,
        error: 'Not Found',
        message: 'Todo not found',
        path: '/todos/123',
        method: 'GET',
        requestId: 'req-1',
      }),
      404,
    );
  });

  it('should map QueryFailedError to 400 without leaking details', () => {
    const filter = new HttpExceptionFilter(httpAdapterHost);
    const exception = new QueryFailedError('SELECT 1', [], new Error('boom'));

    filter.catch(exception, createArgsHost());

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid request',
      }),
      400,
    );
  });

  it('should map unknown errors to 500', () => {
    const filter = new HttpExceptionFilter(httpAdapterHost);
    const exception = new Error('unexpected');

    filter.catch(exception, createArgsHost());

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Internal server error',
      }),
      500,
    );
  });

  it('should surface validation errors as provided by HttpException', () => {
    const filter = new HttpExceptionFilter(httpAdapterHost);
    const exception = new BadRequestException({
      message: ['description should not be empty'],
      error: 'Bad Request',
    });

    filter.catch(exception, createArgsHost());

    expect(reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: ['description should not be empty'],
      }),
      400,
    );
  });

  it('should log the error in production', () => {
    const filter = new HttpExceptionFilter(httpAdapterHost);
    const exception = new NotFoundException('Todo not found');
    const originalEnv = process.env.NODE_ENV;
    const errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    process.env.NODE_ENV = 'production';
    try {
      filter.catch(exception, createArgsHost());
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /todos/123 -> 404'),
        expect.any(String),
      );
    } finally {
      if (originalEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = originalEnv;
      }
    }
  });
});
