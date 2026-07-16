'use strict';

/**
 * Integration tests for the /api/reflections endpoints.
 *
 * Uses mongodb-memory-server for an isolated, in-process MongoDB instance.
 * A real User document is created and a JWT is signed so the auth middleware
 * passes.  All DB state is wiped between tests (afterEach).
 */

jest.setTimeout(60000); // MongoMemoryServer binary download can take time on first run

process.env.JWT_SECRET = 'test-jwt-secret';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const express = require('express');

const User = require('../../models/User');
const Reflection = require('../../models/Reflection');
const reflectionRoutes = require('../../routes/reflection.routes');

let mongod;
let app;
let token;
let userId;

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Minimal Express app — only the reflection routes
  app = express();
  app.use(express.json());
  app.use('/api/reflections', reflectionRoutes);

  // Seed a test user
  const user = await User.create({
    githubId: 'gh-test-user-001',
    username: 'testuser',
    profileUrl: 'https://github.com/testuser',
  });
  userId = user._id;

  token = jwt.sign(
    { id: userId.toString(), githubUsername: 'testuser' },
    'test-jwt-secret',
    { expiresIn: '1d' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Clear reflections between tests; leave the User intact
  await Reflection.deleteMany({});
});

// ─── POST /api/reflections ────────────────────────────────────────────────────

describe('POST /api/reflections', () => {
  test('returns 401 when no Authorization header is supplied', async () => {
    const res = await request(app)
      .post('/api/reflections')
      .send({ date: '2024-01-15', mood: 'okay' });
    expect(res.status).toBe(401);
  });

  test('returns 400 when date field is missing from request body', async () => {
    const res = await request(app)
      .post('/api/reflections')
      .set('Authorization', `Bearer ${token}`)
      .send({ mood: 'okay', note: 'No date in this payload' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Date is required.');
  });

  test('creates and returns a new reflection with provided date, mood, and note', async () => {
    const res = await request(app)
      .post('/api/reflections')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2024-01-15', mood: 'flow', note: 'Great coding session' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Reflection saved');
    expect(res.body.reflection.date).toBe('2024-01-15');
    expect(res.body.reflection.mood).toBe('flow');
    expect(res.body.reflection.note).toBe('Great coding session');
  });

  test('creates a reflection with mood defaulting to "none" when mood is omitted', async () => {
    const res = await request(app)
      .post('/api/reflections')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2024-01-15' });

    expect(res.status).toBe(200);
    expect(res.body.reflection.mood).toBe('none');
    expect(res.body.reflection.note).toBe('');
  });

  test('upserts an existing reflection on the same date — updates mood and note', async () => {
    // Initial entry
    await request(app)
      .post('/api/reflections')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2024-01-15', mood: 'okay', note: 'Morning entry' });

    // Update same date
    const res = await request(app)
      .post('/api/reflections')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2024-01-15', mood: 'stressed', note: 'Evening update' });

    expect(res.status).toBe(200);
    expect(res.body.reflection.mood).toBe('stressed');
    expect(res.body.reflection.note).toBe('Evening update');

    // Exactly one document in the DB for this date
    const count = await Reflection.countDocuments({ user: userId, date: '2024-01-15' });
    expect(count).toBe(1);
  });

  test('partial upsert — only updates the supplied field, keeps the rest', async () => {
    // Create with both mood and note
    await request(app)
      .post('/api/reflections')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2024-01-15', mood: 'flow', note: 'Original note' });

    // Update only mood
    const res = await request(app)
      .post('/api/reflections')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2024-01-15', mood: 'okay' });

    expect(res.status).toBe(200);
    expect(res.body.reflection.mood).toBe('okay');
    // Note is preserved from original
    expect(res.body.reflection.note).toBe('Original note');
  });
});

// ─── GET /api/reflections ─────────────────────────────────────────────────────

describe('GET /api/reflections', () => {
  test('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/reflections');
    expect(res.status).toBe(401);
  });

  test('returns an empty array when the user has no reflections', async () => {
    const res = await request(app)
      .get('/api/reflections')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test('returns the correct number of reflections for the authenticated user', async () => {
    await Reflection.insertMany([
      { user: userId, date: '2024-01-15', mood: 'flow', note: 'Day 1' },
      { user: userId, date: '2024-01-16', mood: 'okay', note: 'Day 2' },
      { user: userId, date: '2024-01-17', mood: 'stressed', note: 'Day 3' },
    ]);

    const res = await request(app)
      .get('/api/reflections')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
  });

  test('reflections are sorted by date descending (most recent first)', async () => {
    await Reflection.insertMany([
      { user: userId, date: '2024-01-15', mood: 'flow' },
      { user: userId, date: '2024-01-17', mood: 'stressed' },
      { user: userId, date: '2024-01-16', mood: 'okay' },
    ]);

    const res = await request(app)
      .get('/api/reflections')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body[0].date).toBe('2024-01-17');
    expect(res.body[1].date).toBe('2024-01-16');
    expect(res.body[2].date).toBe('2024-01-15');
  });
});

// ─── GET /api/reflections/:date ───────────────────────────────────────────────

describe('GET /api/reflections/:date', () => {
  test('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/reflections/2024-01-15');
    expect(res.status).toBe(401);
  });

  test('returns the reflection document for a date that exists', async () => {
    await Reflection.create({
      user: userId,
      date: '2024-01-15',
      mood: 'stressed',
      note: 'Tough deadline day',
    });

    const res = await request(app)
      .get('/api/reflections/2024-01-15')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.date).toBe('2024-01-15');
    expect(res.body.mood).toBe('stressed');
    expect(res.body.note).toBe('Tough deadline day');
  });

  test('returns null (HTTP 200) for a date with no matching reflection', async () => {
    const res = await request(app)
      .get('/api/reflections/2099-12-31')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  test('returns only the reflection belonging to the authenticated user', async () => {
    // Create a second user and a reflection owned by them
    const otherUser = await User.create({
      githubId: 'gh-other-user',
      username: 'otheruser',
    });
    await Reflection.create({
      user: otherUser._id,
      date: '2024-01-15',
      mood: 'flow',
      note: 'Other user entry',
    });

    // Our test user has no reflection on this date
    const res = await request(app)
      .get('/api/reflections/2024-01-15')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeNull(); // not the other user's reflection
  });
});
