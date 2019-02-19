const express = require('express');
const client = require('../../index');

const router = express.Router();

router.use('/', (req, res) => res.status(200).render('admin', {
  client,
  identity: (req.isAuthenticated() ? `${req.user.username}#${req.user.discriminator}` : 'NO'),
}));

module.exports = router;
