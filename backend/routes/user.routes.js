const express = require('express');
const router  = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const { validate, preferencesSchema } = require('../validators');

router.get('/preferences', auth, userController.getPreferences);
router.put('/preferences', auth, validate(preferencesSchema), userController.updatePreferences);

module.exports = router;

