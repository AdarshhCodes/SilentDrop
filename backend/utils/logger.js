'use strict';

/**
 * backend/utils/logger.js
 *
 * Centralised Pino logger.
 *
 * Local-only implementation — no external log-aggregation service is wired in
 * yet.  To add one (e.g. Datadog, Logtail, or a Pino transport to a managed
 * logging SaaS) attach a Pino transport in the `transport` option below without
 * touching any call sites.
 *
 * Log levels:
 *   trace  — granular debug (disabled in prod)
 *   debug  — developer diagnostics
 *   info   — normal lifecycle events (server start, DB connected, cache hit)
 *   warn   — recoverable anomalies (GitHub token fallback, cache miss on retry)
 *   error  — unrecoverable failures that should be investigated
 *
 * PII / secrets policy:
 *   - JWT values are NEVER logged (do not pass req.headers.authorization).
 *   - GitHub token values are NEVER logged (log `hasToken: true/false` only).
 *   - Reflection note text is NEVER logged.
 */

const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino(
  {
    // In production use the numeric level directly; in dev accept strings too.
    level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),

    // Redact sensitive fields wherever they appear in logged objects.
    // pino's redact uses fast-redact under the hood with near-zero overhead.
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.token',
        '*.jwt',
        '*.password',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },
  },

  // Pretty-print in development; raw JSON in production so log collectors
  // (e.g. Render's log drain) can parse structured output efficiently.
  isDev
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
        },
      })
    : undefined
);

module.exports = logger;
