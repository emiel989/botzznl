const express = require('express');

const router = express.Router();

/* Routes */
const bot = require('./bot');
const guild = require('./guild');

router.use('/bot', bot);
router.use('/guild', guild);

module.exports = router;
