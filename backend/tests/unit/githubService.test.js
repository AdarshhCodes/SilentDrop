'use strict';

/**
 * Unit tests for the self-healing behaviour inside githubService.js.
 *
 * The self-healing logic lives in makeGithubRequest():
 *   - If the first call returns HTTP 401 AND process.env.GITHUB_TOKEN is set,
 *     the function creates a new, unauthenticated axios instance and retries.
 *
 * Strategy:
 *   - Use nock to intercept HTTPS calls to api.github.com.
 *   - Use jest.isolateModules() to obtain a fresh module copy so that
 *     GITHUB_TOKEN is baked into the githubApi instance at the correct time.
 *   - The module-level cache (todaysCommitsCache) is also fresh per isolateModules call.
 */

const nock = require('nock');

beforeAll(() => {
  // Prevent any real HTTP calls escaping the test suite
  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
});

afterEach(() => {
  nock.cleanAll();
  // Always clean up the token so subsequent tests start neutral
  delete process.env.GITHUB_TOKEN;
});

// ─── Helper: get a fresh module instance with current env vars ────────────────
function freshGithubService() {
  let svc;
  jest.isolateModules(() => {
    svc = require('../../services/githubService');
  });
  return svc;
}

// ─────────────────────────────────────────────────────────────────────────────

describe('makeGithubRequest — 401 self-healing retry', () => {
  test('retries unauthenticated and succeeds when server returns 401 with a bad token', async () => {
    process.env.GITHUB_TOKEN = 'bad-test-token';

    const { getTodaysCommitCount } = freshGithubService();

    // Interceptor 1: authenticated request → 401 Bad credentials
    nock('https://api.github.com')
      .get('/search/commits')
      .query(true)
      .matchHeader('authorization', 'Bearer bad-test-token')
      .reply(401, { message: 'Bad credentials' });

    // Interceptor 2: unauthenticated retry → 200 with known commit count
    nock('https://api.github.com')
      .get('/search/commits')
      .query(true)
      .reply(200, { total_count: 7, items: [] });

    const count = await getTodaysCommitCount('testuser');

    expect(count).toBe(7);
    // Both nock interceptors must have been consumed
    expect(nock.isDone()).toBe(true);
  });

  test('does NOT retry when no GITHUB_TOKEN is set and 401 is received — returns 0 gracefully', async () => {
    // No token set → retry branch is never entered
    delete process.env.GITHUB_TOKEN;

    const { getTodaysCommitCount } = freshGithubService();

    nock('https://api.github.com')
      .get('/search/commits')
      .query(true)
      .reply(401, { message: 'Unauthorized' });

    // getTodaysCommitCount catches the thrown error and returns 0
    const count = await getTodaysCommitCount('testuser');
    expect(count).toBe(0);
  });

  test('returns 0 gracefully on a network-level connection error', async () => {
    delete process.env.GITHUB_TOKEN;

    const { getTodaysCommitCount } = freshGithubService();

    nock('https://api.github.com')
      .get('/search/commits')
      .query(true)
      .replyWithError('simulated network failure');

    const count = await getTodaysCommitCount('testuser');
    expect(count).toBe(0);
  });
});

describe('getTodaysCommitCount — successful path (no token, direct success)', () => {
  test('returns the total_count from GitHub Search API on a successful response', async () => {
    delete process.env.GITHUB_TOKEN;

    const { getTodaysCommitCount } = freshGithubService();

    nock('https://api.github.com')
      .get('/search/commits')
      .query(true)
      .reply(200, { total_count: 12, items: [] });

    const count = await getTodaysCommitCount('devuser');
    expect(count).toBe(12);
  });

  test('returns 0 when GitHub reports 0 commits today', async () => {
    delete process.env.GITHUB_TOKEN;

    const { getTodaysCommitCount } = freshGithubService();

    nock('https://api.github.com')
      .get('/search/commits')
      .query(true)
      .reply(200, { total_count: 0, items: [] });

    const count = await getTodaysCommitCount('devuser');
    expect(count).toBe(0);
  });
});
