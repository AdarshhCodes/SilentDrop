'use strict';

/**
 * backend/middleware/errorHandler.js
 *
 * Centralised Express error-handling middleware.
 *
 * LOCAL-ONLY implementation.  No external error-tracking service (e.g. Sentry,
 * Bugsnag) is wired in here.  To add one, call its captureException() (or
 * equivalent) inside the handler BEFORE the res.json() call — the function
 * signature and placement in server.js do not need to change.
 *
 * Contract:
 *   - Logs the full error (including stack) server-side via Pino, with request
 *     ID, route, method, and HTTP status so incidents are debuggable without
 *     exposing internals to clients.
 *   - Returns a generic, safe JSON body to the client — no stack traces, no
 *     internal error messages, no DB details.
 *   - Defaults to HTTP 500 if the error has no `status` / `statusCode` field.
 *
 * Wire this in as the LAST app.use() in server.js, after all routes.
 */

const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  // Structured server-side log — always includes enough context to diagnose.
  logger.error(
    {
      reqId: req.id,           // set by pino-http
      method: req.method,
      url: req.url,
      status,
      // err is serialised by Pino's built-in err serialiser (message + stack).
      err,
    },
    'Unhandled request error'
  );

  // Generic, safe response — never leak stack traces or internal details.
  res.status(status).json({
    error: status < 500
      ? err.message || 'Request error'   // client errors (4xx) can be descriptive
      : 'Internal server error',         // server errors (5xx) are always generic
  });
};
