/* ****************** */
/* iBot - Source code */
/*   2017 -- October  */
/* GNU AGPLv3 LICENSE */
/* ****************** */

/* MODULES */
const Discord = require('discord.js');
const Enmap = require('enmap');
const Level = require('enmap-level');
const { readdir } = require('fs');

/* ERRORS HANDLING */
process.on('unhandledRejection', (reason) => {
  if (reason instanceof Discord.DiscordAPIError) return;
  console.error(reason.message);
});

/* CLIENT INITIALIZATION */
const client = new Discord.Client({
  disableEveryone: true,
  fetchAllMembers: true,
});
client.config = require('./src/config.json');
client.I18n = require('node-i18n');

client.languages = {};

/* CLEVERBOT */
client.cleverbot = true;
client.cs = {};

/* PHONES */
client.calls = {};

/* DATABASE */
client.servers = new Enmap({ provider: new Level({ name: 'servers' }) });
client.tags = new Enmap({ provider: new Level({ name: 'tags' }) });
client.lastactive = new Enmap({ provider: new Level({ name: 'lastactive' }) });
client.afk = new Enmap({ provider: new Level({ name: 'afk' }) });
client.stats = new Enmap({ provider: new Level({ name: 'stats' }) });
client.profiles = new Enmap({ provider: new Level({ name: 'profiles' }) });
client.numbers = new Enmap({ provider: new Level({ name: 'numbers' }) });
client.timeout = new Enmap({ provider: new Level({ name: 'timeout' }) });

/* COMMANDS */
client.commands = new Enmap();
client.aliases = new Enmap();
client.cooldown = new Set();

/* HANDLER */
// Helpers
readdir('./src/helpers/', (err, files) => {
  if (err) throw err;
  console.log(`[Helpers] Loading ${files.length} modules...`);

  files.forEach((f) => {
    const helper = require(`./src/helpers/${f}`);
    client[f.split('.')[0]] = helper;
  });
});

// Translations
readdir('./src/translations/', (err, files) => {
  if (err) throw err;
  console.log(`[Translations] Loading ${files.length} translations...`);

  files.forEach((f) => {
    const translation = require(`./src/translations/${f}`);
    client.languages[f.split('.')[0]] = translation;
  });

  client.I18n.init({ bundles: client.languages, defaultCurrency: 'EUR' });
});

// Commands
const categories = client.config.discord.commandCategories;
for (let i = 0; i < categories.length; i++) {
  readdir(`./src/commands/${categories[i].toLowerCase()}/`, (err, files) => {
    if (err) throw err;
    console.log(`[Commands] Loading ${files.length} commands... (category: ${i})`);

    files.forEach((f) => {
      const command = require(`./src/commands/${categories[i].toLowerCase()}/${f}`);
      command.conf.category = categories[i];
      client.commands.set(command.conf.name, command);
      command.conf.aliases.forEach(a => client.aliases.set(a, command.conf.name));
    });
  });
}

// Events
readdir('./src/events/', (err, files) => {
  if (err) throw err;
  console.log(`[Events] Loading ${files.length} events...`);

  files.forEach((f) => {
    const event = require(`./src/events/${f}`);
    const eventName = f.split('.')[0];
    client.on(eventName, event.bind(null, client));
    delete require.cache[require.resolve(`./src/events/${f}`)];
  });
});

// Login to Discord
client.login(client.config.discord.token)
  .then(() => console.log('[Discord] Connected to the WebSocket!'))
  .catch(console.error);

module.exports = client;
