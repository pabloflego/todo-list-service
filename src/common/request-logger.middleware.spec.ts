import { Logger } from '@nestjs/common';
import { requestLogger } from './request-logger.middleware';
import { describe, expect, it, vi } from 'vitest';

const createMocks = () => {
  const req: any = {
    headers: {},
    method: 'GET',
    originalUrl: '/todos',
  };
  const finishListeners: Array<() => void> = [];
  const res: any = {
    statusCode: 200,
    setHeader: vi.fn(),
    on: vi.fn((event: string, listener: () => void) => {
      if (event === 'finish') finishListeners.push(listener);
    }),
  };
  const next = vi.fn();
  return { req, res, next, finishListeners };
};

describe('requestLogger middleware', () => {
  it('sets a request id header, propagates it, and logs on finish', () => {
    const logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const middleware = requestLogger(new Logger('HTTP'));
    const { req, res, next, finishListeners } = createMocks();

    middleware(req as any, res as any, next as any);

    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', expect.any(String));
    expect(req.requestId).toBeDefined();

    finishListeners.forEach((listener) => listener());
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/\[.*\] GET \/todos 200 \d+ms/));
  });

  it('reuses incoming x-request-id header if present', () => {
    const middleware = requestLogger(new Logger('HTTP'));
    const { req, res, next, finishListeners } = createMocks();
    req.headers['x-request-id'] = 'incoming-id';

    middleware(req as any, res as any, next as any);
    finishListeners.forEach((listener) => listener());

    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'incoming-id');
    expect(req.requestId).toBe('incoming-id');
  });
});
