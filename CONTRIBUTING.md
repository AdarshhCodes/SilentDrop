# Contributing to SilentDrop

Thank you for taking the time to contribute! Please read this guide before opening a PR.

---

## CI must pass before merge

Every pull request runs two parallel GitHub Actions jobs (defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

| Job | What it runs |
|---|---|
| **Backend** | `npm ci` → ESLint → Jest (with coverage) |
| **Frontend** | `npm ci` → ESLint → Vitest (with coverage) |

**PRs are not merged until both jobs are green.** There are no exceptions — the branch protection rule enforces this.

---

## Running tests locally

### Backend (runs from repo root)

```bash
# Install dependencies (repo root)
npm ci

# Run all backend tests
npm test

# Run with coverage report
npm run test:coverage
```

Test files live in `backend/tests/unit/` and `backend/tests/integration/`.

### Frontend (runs from `frontend/`)

```bash
cd frontend

# Install dependencies
npm ci

# Run all frontend tests (single pass)
npm test

# Watch mode during development
npm run test:watch

# Run with coverage report
npm run test:coverage
```

Test files live in `frontend/src/test/`.

---

## Lint conventions

SilentDrop uses **ESLint** with the shared configs declared in each package:

| Layer | Config file | Run command |
|---|---|---|
| Frontend | `frontend/eslint.config.js` | `cd frontend && npm run lint` |

Rules that matter:
- **No unused variables** — clean up imports before opening a PR.
- **React Hooks rules** — `eslint-plugin-react-hooks` is active; don't call hooks conditionally.
- **`react-refresh` boundaries** — ensure components only export React components as default exports.
- **Max warnings = 0** — CI fails on warnings, not just errors. Fix all lint output before pushing.

To auto-fix many issues:

```bash
cd frontend
npx eslint . --fix
```

---

## Commit messages

Use the conventional format where possible:

```
feat: add weekly summary endpoint
fix: correct IST day boundary calculation
test: add unit tests for calculateDailyRisk
chore: update dependencies
```

---

## Secrets required for CI/CD

The following **repository secrets** must be set in GitHub before the deploy workflow can run:

| Secret name | Where to get the value |
|---|---|
| `RENDER_DEPLOY_HOOK_URL` | Render dashboard → your backend service → **Settings** → **Deploy Hook** → copy the full URL |

`GITHUB_TOKEN` is automatically provided by GitHub Actions — you do not need to create it.

> **Never paste real secret values into a PR, commit, or chat message.**

---

## Opening a PR

1. Branch off `main`: `git checkout -b feat/your-feature`
2. Make your changes.
3. Run lint and tests locally (see above) before pushing.
4. Open a PR against `main`.
5. Wait for both CI jobs to pass — the PR will be blocked until they do.
6. Request a review from a maintainer.
