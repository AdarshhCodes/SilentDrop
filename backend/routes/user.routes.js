const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');

router.get('/preferences', auth, userController.getPreferences);
router.put('/preferences', auth, userController.updatePreferences);

module.exports = router;
