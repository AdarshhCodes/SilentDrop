'use strict';

/**
 * backend/tests/unit/validators.test.js
 *
 * Tests for:
 *   c. PUT /api/user/preferences with coreHoursEnd <= coreHoursStart → 400
 *      with field-level validation errors.
 *
 * Also covers the reflectionBodySchema for date format and mood enum.
 * These are real integration-style tests through the validate() middleware
 * and a minimal Express app so they verify the full 400-response shape.
 */

const request  = require('supertest');
const express  = require('express');
const jwt      = require('jsonwebtoken');

process.env.JWT_SECRET           = 'test-access-secret-validators';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-validators';

const { validate, preferencesSchema, reflectionBodySchema } = require('../../validators');
const auth = require('../../middleware/auth');

// ─── Minimal test app ─────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Mount the preferences validator on a test route
app.put('/test/preferences', auth, validate(preferencesSchema), (_req, res) => {
  res.json({ ok: true });
});

// Mount the reflection validator on a test route
app.post('/test/reflection', auth, validate(reflectionBodySchema), (_req, res) => {
  res.json({ ok: true });
});

// ─── Token helper ─────────────────────────────────────────────────────────────
function makeToken() {
  return jwt.sign(
    { id: 'user-123', githubUsername: 'tester' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

const TOKEN = makeToken();
const AUTH  = { Authorization: `Bearer ${TOKEN}` };

// ─── Preferences schema ───────────────────────────────────────────────────────

describe('preferencesSchema — coreHoursEnd > coreHoursStart validation', () => {
  // c. Core test: coreHoursEnd must be GREATER than coreHoursStart
  test('coreHoursEnd === coreHoursStart → 400 with field-level error', async () => {
    const res = await request(app)
      .put('/test/preferences')
      .set(AUTH)
      .send({ timezone: 'Asia/Kolkata', coreHoursStart: 9, coreHoursEnd: 9 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.fields).toBeDefined();
    // Zod refine attaches to coreHoursEnd path
    expect(res.body.fields.coreHoursEnd).toBeDefined();
    expect(res.body.fields.coreHoursEnd[0]).toMatch(/greater than/i);
  });

  test('coreHoursEnd < coreHoursStart → 400 with field-level error', async () => {
    const res = await request(app)
      .put('/test/preferences')
      .set(AUTH)
      .send({ timezone: 'UTC', coreHoursStart: 17, coreHoursEnd: 9 });

    expect(res.status).toBe(400);
    expect(res.body.fields.coreHoursEnd[0]).toMatch(/greater than/i);
  });

  test('coreHoursEnd > coreHoursStart → 200', async () => {
    const res = await request(app)
      .put('/test/preferences')
      .set(AUTH)
      .send({ timezone: 'UTC', coreHoursStart: 9, coreHoursEnd: 17 });

    expect(res.status).toBe(200);
  });

  test('timezone missing → 400', async () => {
    const res = await request(app)
      .put('/test/preferences')
      .set(AUTH)
      .send({ coreHoursStart: 9, coreHoursEnd: 17 });

    expect(res.status).toBe(400);
    expect(res.body.fields.timezone).toBeDefined();
  });

  test('coreHoursStart out of range (24) → 400', async () => {
    const res = await request(app)
      .put('/test/preferences')
      .set(AUTH)
      .send({ timezone: 'UTC', coreHoursStart: 24, coreHoursEnd: 25 });

    expect(res.status).toBe(400);
  });

  test('timezone empty string → 400', async () => {
    const res = await request(app)
      .put('/test/preferences')
      .set(AUTH)
      .send({ timezone: '', coreHoursStart: 9, coreHoursEnd: 17 });

    expect(res.status).toBe(400);
    expect(res.body.fields.timezone).toBeDefined();
  });

  test('valid boundary values (coreHoursEnd = 23, coreHoursStart = 0) → 200', async () => {
    const res = await request(app)
      .put('/test/preferences')
      .set(AUTH)
      .send({ timezone: 'America/New_York', coreHoursStart: 0, coreHoursEnd: 23 });

    expect(res.status).toBe(200);
  });
});

// ─── Reflection schema ────────────────────────────────────────────────────────

describe('reflectionBodySchema — date and mood validation', () => {
  test('invalid date format → 400', async () => {
    const res = await request(app)
      .post('/test/reflection')
      .set(AUTH)
      .send({ date: '18-07-2026', mood: 'okay' });

    expect(res.status).toBe(400);
    expect(res.body.fields.date).toBeDefined();
    expect(res.body.fields.date[0]).toMatch(/YYYY-MM-DD/i);
  });

  test('invalid mood value → 400', async () => {
    const res = await request(app)
      .post('/test/reflection')
      .set(AUTH)
      .send({ date: '2026-07-18', mood: 'happy' });

    expect(res.status).toBe(400);
    expect(res.body.fields.mood).toBeDefined();
  });

  test('note exceeding 200 chars → 400', async () => {
    const res = await request(app)
      .post('/test/reflection')
      .set(AUTH)
      .send({ date: '2026-07-18', mood: 'flow', note: 'x'.repeat(201) });

    expect(res.status).toBe(400);
    expect(res.body.fields.note).toBeDefined();
  });

  test('valid request (all fields) → 200', async () => {
    const res = await request(app)
      .post('/test/reflection')
      .set(AUTH)
      .send({ date: '2026-07-18', mood: 'flow', note: 'Good day' });

    expect(res.status).toBe(200);
  });

  test('valid request (date only, mood + note optional) → 200', async () => {
    const res = await request(app)
      .post('/test/reflection')
      .set(AUTH)
      .send({ date: '2026-07-18' });

    expect(res.status).toBe(200);
  });
});
