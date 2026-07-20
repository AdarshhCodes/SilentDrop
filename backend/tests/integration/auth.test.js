'use strict';

/**
 * backend/tests/integration/auth.test.js
 *
 * Tests for:
 *   a. POST /api/auth/refresh — valid token issues new pair; old token is
 *      then rejected (confirms hash rotation, not just new token issuance).
 *   b. POST /api/auth/refresh — invalid/expired/tampered token → 401.
 *   d. Rate limit on /api/auth/github specifically returns 429 after the limit.
 *      Uses RATE_LIMIT_WINDOW_MS env var for a short window so no real wait.
 */

const request  = require('supertest');
const express  = require('express');
const jwt      = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// ─── Test env setup ────────────────────────────────────────────────────────────
process.env.JWT_SECRET             = 'test-access-secret-auth';
process.env.REFRESH_TOKEN_SECRET   = 'test-refresh-secret-auth';
process.env.RATE_LIMIT_WINDOW_MS   = '10000';  // 10 s window
process.env.RATE_LIMIT_AUTH_MAX    = '3';       // limit of 3 so 4 requests triggers 429

const {
  signAccessToken,
  signRefreshToken,
  hashRefreshToken,
} = require('../../utils/jwt');

const User         = require('../../models/User');
const authRouter   = require('../../routes/auth');
const errorHandler = require('../../middleware/errorHandler');

// ─── Minimal Express app ──────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use('/api/auth', authRouter);
app.use(errorHandler);


// ─── In-memory DB ─────────────────────────────────────────────────────────────
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createUserWithRefreshToken() {
  const user = await User.create({
    githubId: `gh-${Date.now()}`,
    username: 'testuser',
    profileUrl: 'https://github.com/testuser',
  });

  const refreshToken = signRefreshToken(user._id);
  await User.findByIdAndUpdate(user._id, {
    refreshTokenHash: hashRefreshToken(refreshToken),
  });

  return { user, refreshToken };
}

// ─── a. Valid refresh token ────────────────────────────────────────────────────

describe('POST /api/auth/refresh — valid token', () => {
  test(
    'issues a new accessToken + refreshToken pair, and the OLD refresh token ' +
    'is rejected on a subsequent call (hash rotation confirmed)',
    async () => {
      const { refreshToken: oldRefreshToken } = await createUserWithRefreshToken();

      // First refresh — must succeed
      const res1 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(res1.status).toBe(200);
      expect(res1.body).toHaveProperty('accessToken');
      expect(res1.body).toHaveProperty('refreshToken');

      const newRefreshToken = res1.body.refreshToken;
      expect(newRefreshToken).not.toBe(oldRefreshToken);

      // Verify the new access token is a valid JWT
      const decoded = jwt.verify(res1.body.accessToken, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('id');

      // Second call with the OLD refresh token — must be rejected (hash rotated)
      const res2 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(res2.status).toBe(401);
      expect(res2.body.error).toMatch(/already used|revoked/i);
    }
  );

  test('the new refresh token from a successful rotation IS accepted', async () => {
    const { refreshToken: oldRefreshToken } = await createUserWithRefreshToken();

    const res1 = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefreshToken });

    expect(res1.status).toBe(200);
    const newRefreshToken = res1.body.refreshToken;

    // New token should work on the next refresh
    const res2 = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: newRefreshToken });

    expect(res2.status).toBe(200);
    expect(res2.body).toHaveProperty('accessToken');
  });
});

// ─── b. Invalid / expired / tampered tokens ───────────────────────────────────

describe('POST /api/auth/refresh — invalid/expired/tampered tokens', () => {
  test('missing body → 401', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(401);
  });

  test('random string (not a JWT) → 401', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'not-a-jwt-at-all' });
    expect(res.status).toBe(401);
  });

  test('access token passed as refresh token → 401 (wrong type)', async () => {
    const { user } = await createUserWithRefreshToken();
    const accessToken = signAccessToken(user);

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: accessToken });

    expect(res.status).toBe(401);
  });

  test('expired refresh token → 401', async () => {
    const { user } = await createUserWithRefreshToken();

    // Sign a refresh token that expired 1 second ago
    const expiredToken = jwt.sign(
      { sub: String(user._id), type: 'refresh' },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: -1 }
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: expiredToken });

    expect(res.status).toBe(401);
  });

  test('valid JWT structure but signed with wrong secret → 401', async () => {
    const { user } = await createUserWithRefreshToken();

    const tampered = jwt.sign(
      { sub: String(user._id), type: 'refresh' },
      'wrong-secret',
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: tampered });

    expect(res.status).toBe(401);
  });

  test('valid refresh token for a non-existent user → 401', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const token  = signRefreshToken(fakeId);

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: token });

    expect(res.status).toBe(401);
  });

  test('valid refresh token but refreshTokenHash cleared (logout) → 401', async () => {
    const { user, refreshToken } = await createUserWithRefreshToken();

    // Simulate logout — clear the stored hash
    await User.findByIdAndUpdate(user._id, { refreshTokenHash: null });

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(401);
  });
});

// ─── Rate limiting is tested separately in rateLimit.test.js ─────────────────
// Rationale: testing the limiter requires a fresh Express app without passport
// strategy registration, which creates module-cache conflicts in this file.
// See backend/tests/integration/rateLimit.test.js for full coverage.







