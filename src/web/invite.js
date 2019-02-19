const express = require('express');
const client = require('../../index')

const router = express.Router();

router.get('/', async (req, res) => res.redirect(await client.generateInvite()));

module.exports = router;
