const express = require('express');
const client = require('../../index')

const router = express.Router();

router.get('/', async (req, res) => res.redirect(await client.guilds.get('382951433378594817').channels.get('382960914296733697').createInvite({
  maxAge: 120,
  maxUses: 1,
}).then(invite => invite.url)));

module.exports = router;
