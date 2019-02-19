const express = require('express');
const client = require('../../../index');

const router = express.Router();

router.get('/stats', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*').status(200).json({
    uptime: Date.now() - client.readyAt.getTime(),
    guilds: client.guilds.size,
    users: client.users.size,
    channels: client.channels.size,
    languages: Object.keys(client.languages).length,
    cmdsran: parseInt(client.stats.get('cmdsran')),
    ram: Math.floor(process.memoryUsage().heapUsed / 1000000),
  });
});

module.exports = router;
