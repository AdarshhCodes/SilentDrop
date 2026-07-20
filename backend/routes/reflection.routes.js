const express    = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const router     = express.Router();
const reflectionController        = require('../controllers/reflection.controller');
const exportReflectionsController = require('../controllers/exportReflections.controller');
const auth = require('../middleware/auth');
const { validate, reflectionBodySchema } = require('../validators');

// ─── Export rate limiter ───────────────────────────────────────────────────────
// PDF generation is CPU-intensive; limit each user to 5 exports per hour.
// keyGenerator uses the JWT user id so the limit is per-user, not per-IP.
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 5,
  // Primary key: JWT user id — per-user, not per-IP.
  // Fallback: ipKeyGenerator (library helper) for any unauthenticated hits.
  keyGenerator: (req) => req.user?.id?.toString() ?? ipKeyGenerator(req),
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Export limit reached. You can export up to 5 times per hour.',
    });
  },
  standardHeaders: false,
  legacyHeaders:   false,
});


// ─── Export route (MUST be above /:date to avoid shadowing) ──────────────────
router.get('/export', auth, exportLimiter, exportReflectionsController.exportReflections);

// ─── Existing routes (unchanged) ─────────────────────────────────────────────
router.post('/', auth, validate(reflectionBodySchema), reflectionController.addReflection);
router.get('/', auth, reflectionController.getReflections);
router.get('/:date', auth, reflectionController.getReflectionForDate);

module.exports = router;

