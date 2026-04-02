const express = require('express');
const router = express.Router();
const reflectionController = require('../controllers/reflection.controller');
const auth = require('../middleware/auth');

router.post('/', auth, reflectionController.addReflection);
router.get('/', auth, reflectionController.getReflections);
router.get('/:date', auth, reflectionController.getReflectionForDate);

module.exports = router;
