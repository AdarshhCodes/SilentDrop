'use strict';

/**
 * backend/tests/unit/errorHandler.test.js
 *
 * Unit tests for the centralised Express error-handling middleware.
 *
 * Core security property under test:
 *   The internal error message (err.message) and stack trace MUST appear in
 *   the server-side log but MUST NEVER appear in the HTTP response body.
 *
 * Approach:
 *   - Build a minimal throwaway Express app for each test (or reuse one app
 *     with different routes) that deliberately calls next(err).
 *   - Mock backend/utils/logger so we can assert what was logged server-side
 *     without any I/O side-effects.
 *   - Use Supertest to hit the routes and inspect the HTTP response.
 */

// ─── Logger mock (must be declared before the module under test is required) ───
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  warn:  jest.fn(),
  info:  jest.fn(),
  debug: jest.fn(),
}));

const request      = require('supertest');
const express      = require('express');
const logger       = require('../../utils/logger');
const errorHandler = require('../../middleware/errorHandler');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a minimal Express app with a single route that calls next(err), and
 * with errorHandler mounted as the last middleware.
 *
 * @param {Function} routeFactory - (req, res, next) => void
 */
function makeApp(routeFactory) {
  const app = express();
  app.get('/test', routeFactory);
  app.use(errorHandler);
  return app;
}

// ─── Reset mock state between tests ───────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
});

// ─── 1. Generic Error (no status attached) → 500 ─────────────────────────────

describe('errorHandler — generic Error with no status', () => {
  const INTERNAL_MESSAGE = 'super secret db error details';

  let app;
  beforeAll(() => {
    app = makeApp((_req, _res, next) => {
      next(new Error(INTERNAL_MESSAGE));
    });
  });

  test('responds with HTTP 500', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
  });

  test('response body contains "Internal server error" (generic)', async () => {
    const res = await request(app).get('/test');
    expect(res.body.error).toBe('Internal server error');
  });

  test('response body does NOT contain the real err.message', async () => {
    const res = await request(app).get('/test');
    // This is the core security assertion — err.message must be withheld from clients.
    expect(JSON.stringify(res.body)).not.toContain(INTERNAL_MESSAGE);
  });

  test('logger.error was called with the real error object', async () => {
    await request(app).get('/test');
    expect(logger.error).toHaveBeenCalledTimes(1);
    const [loggedMeta] = logger.error.mock.calls[0];
    // err is passed to the logger so the real message and stack are server-visible
    expect(loggedMeta.err).toBeInstanceOf(Error);
    expect(loggedMeta.err.message).toBe(INTERNAL_MESSAGE);
  });

  test('logger.error is called with method, url, and status', async () => {
    await request(app).get('/test');
    const [loggedMeta] = logger.error.mock.calls[0];
    expect(loggedMeta.method).toBe('GET');
    expect(loggedMeta.url).toBe('/test');
    expect(loggedMeta.status).toBe(500);
  });
});

// ─── 2. Error with a 4xx status attached ─────────────────────────────────────

describe('errorHandler — error with status 404 attached', () => {
  const CLIENT_MESSAGE = 'Resource not found';

  let app;
  beforeAll(() => {
    app = makeApp((_req, _res, next) => {
      const err = new Error(CLIENT_MESSAGE);
      err.status = 404;
      next(err);
    });
  });

  test('responds with HTTP 404', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(404);
  });

  test('response body surfaces err.message for 4xx (descriptive, not generic)', async () => {
    const res = await request(app).get('/test');
    // 4xx errors MAY expose their message — it's not sensitive internal state
    expect(res.body.error).toBe(CLIENT_MESSAGE);
  });

  test('logger.error was called with the real error object', async () => {
    await request(app).get('/test');
    expect(logger.error).toHaveBeenCalledTimes(1);
    const [loggedMeta] = logger.error.mock.calls[0];
    expect(loggedMeta.err.message).toBe(CLIENT_MESSAGE);
    expect(loggedMeta.status).toBe(404);
  });
});

// ─── 3. Error with a statusCode property (alternate convention) ───────────────

describe('errorHandler — error with statusCode (not status) set to 422', () => {
  let app;
  beforeAll(() => {
    app = makeApp((_req, _res, next) => {
      const err = new Error('Validation failed');
      err.statusCode = 422;
      next(err);
    });
  });

  test('responds with HTTP 422 (reads statusCode when status is absent)', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(422);
  });

  test('response body surfaces the message for 4xx errors', async () => {
    const res = await request(app).get('/test');
    expect(res.body.error).toBe('Validation failed');
  });
});

// ─── 4. Error with no message at all ─────────────────────────────────────────

describe('errorHandler — error with no message (empty Error)', () => {
  let app;
  beforeAll(() => {
    app = makeApp((_req, _res, next) => {
      next(new Error()); // message is '' (empty string, falsy)
    });
  });

  test('responds with HTTP 500', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
  });

  test('response body still returns "Internal server error" (not undefined or empty)', async () => {
    const res = await request(app).get('/test');
    expect(res.body.error).toBe('Internal server error');
  });

  test('logger.error was still called', async () => {
    await request(app).get('/test');
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});

// ─── 5. 5xx with a message — message MUST NOT leak to client ─────────────────

describe('errorHandler — 5xx with a revealing message', () => {
  const REVEALING_MESSAGE = 'MongoServerError: duplicate key error on users._id_';

  let app;
  beforeAll(() => {
    app = makeApp((_req, _res, next) => {
      const err = new Error(REVEALING_MESSAGE);
      err.status = 503;
      next(err);
    });
  });

  test('responds with HTTP 503', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(503);
  });

  test('response body is "Internal server error" — NOT the revealing message', async () => {
    const res = await request(app).get('/test');
    expect(res.body.error).toBe('Internal server error');
    expect(JSON.stringify(res.body)).not.toContain('MongoServerError');
    expect(JSON.stringify(res.body)).not.toContain('duplicate key');
  });

  test('logger.error WAS called with the full revealing message (server-side only)', async () => {
    await request(app).get('/test');
    const [loggedMeta] = logger.error.mock.calls[0];
    // Confirm the detail is present in the log (not silently dropped)
    expect(loggedMeta.err.message).toContain('MongoServerError');
  });
});
