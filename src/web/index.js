/* ************** */
/* iBot Dashboard */
/* v2.0 • Express */
/* ************** */

/* Modules */
const client = require('../../index');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const authentication = require('../web/auth/auth');
const { promisify } = require('util');
const request = promisify(require('request'));
const https = require('https');
const { readFileSync } = require('fs');

const app = express();

/* Routes */
const api = require('./api/index');
const auth = require('./auth');
const admin = require('./admin');
const invite = require('./invite');
const server = require('./server');
const servers = require('./servers');
const tos = require('./tos');
const user = require('./user');
const support = require('./support');

/* Auth checker */
const checkOwner = (req, res, next) => {
  if (req.isAuthenticated()) {
    if (client.config.discord.ownerID === req.user.id) next();
    else res.status(403).render('error', { code: '403', identity: (req.isAuthenticated() ? `${req.user.username}#${req.user.discriminator}` : 'NO') });
  } else {
    res.redirect('./auth/login');
  }
};

const checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('./auth/login');
  }
};

// Middlewares
app
  .enable('trust proxy')
  .use(express.static('./src/web/public'))
  .use(bodyParser.urlencoded({
    extended: false,
  }))
  .use(cookieParser(client.config.dashboard.session_secret))
  .use(session({
    secret: client.config.dashboard.session_secret,
    resave: true,
    saveUninitialized: true,
    proxy: true,
  }))
  .use(authentication.initialize())
  .use(authentication.session())
  .set('view engine', 'ejs')
  .set('views', `${__dirname}/templates`);

// Page handling
app.get('/', (req, res) => {
  res.status(200).render('index', {
    identity: (req.isAuthenticated() ? `${req.user.username}#${req.user.discriminator}` : 'NO'),
  });
});

app
  .use('/auth', auth)
  .use('/api', api)
  .use('/support', support)
  .use('/admin', checkOwner, admin)
  .use('/servers', checkAuth, servers)
  .use('/user', checkAuth, user)
  .use('/server', checkAuth, server)
  .use('/invite', checkAuth, invite)
  .use('/tos', tos)
  .use('*', (req, res) => res.status(404).render('error', { code: '404', identity: (req.isAuthenticated() ? `${req.user.username}#${req.user.discriminator}` : 'NO') }));

module.exports.express = app;

module.exports.load = () => {
  module.exports.httpServer = app.listen(client.config.dashboard.port, (err) => {
    if (err) console.error(err);
    else console.log(`[Express HTTP] Listening on ${client.config.dashboard.port}`);
  });
};
