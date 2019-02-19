const client = require('../../index');

const express = require('express');
const router = express.Router();
const timeago = require('time-ago');

router.use('/:id', (req, res) => {
  client.users.fetch(req.params.id)
    .then((user) => {
      let lastactive = 'No information';
      if (client.lastactive.has(user.id)) {
        const time = parseInt(client.lastactive.get(user.id));
        lastactive = timeago.ago(time);
      }

      res.status(200).render('user', {
        user,
        lastactive,
        identity: (req.isAuthenticated() ? `${req.user.username}#${req.user.discriminator}` : 'NO'),
      });
    }).catch(() => res.redirect('/'));
});

router.use('/', (req, res) => res.redirect('/'));

module.exports = router;
