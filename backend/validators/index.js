'use strict';

/**
 * backend/validators/index.js
 *
 * Zod schemas for every request body currently accepted by the API.
 * These run BEFORE the controller, providing a clear field-level 400
 * before Mongoose-level validation is even reached.
 *
 * The `validate(schema)` factory returns an Express middleware that:
 *   1. Parses req.body against the schema (safeParse — never throws).
 *   2. On failure: responds 400 { error, fields } and stops the chain.
 *   3. On success: replaces req.body with the parsed (coerced) value and
 *      calls next().
 */

const { z } = require('zod');

// ─── Preferences (PUT /api/user/preferences) ─────────────────────────────────
const preferencesSchema = z
  .object({
    timezone:       z.string().min(1, 'timezone is required'),
    coreHoursStart: z.number().int().min(0).max(23),
    coreHoursEnd:   z.number().int().min(0).max(23),
  })
  .refine((d) => d.coreHoursEnd > d.coreHoursStart, {
    message: 'coreHoursEnd must be greater than coreHoursStart',
    path:    ['coreHoursEnd'],
  });

// ─── Reflection (POST /api/reflections) ──────────────────────────────────────
const MOOD_VALUES = ['flow', 'okay', 'stressed', 'none'];

const reflectionBodySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  mood: z
    .enum(MOOD_VALUES, { errorMap: () => ({ message: `mood must be one of: ${MOOD_VALUES.join(', ')}` }) })
    .optional(),
  note: z
    .string()
    .max(200, 'note must be 200 characters or fewer')
    .optional(),
});


// ─── Middleware factory ───────────────────────────────────────────────────────
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error:  'Validation failed',
        fields: result.error.flatten().fieldErrors,
      });
    }
    // Replace body with the coerced/defaulted value from Zod
    req.body = result.data;
    next();
  };
}

module.exports = { validate, preferencesSchema, reflectionBodySchema };
