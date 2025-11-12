const express = require('express');
const router = express.Router();
const { getWeather } = require('../controllers/weatherController');
const auth = require('../middleware/auth');

router.get('/', auth, getWeather);

module.exports = router;
