const dashboard = require('../web/index');
const snekfetch = require('snekfetch');
const config = require('../config.json');

module.exports = async (client) => {
  /* LOGGING */
  console.log(`[Bot] Logged in as ${client.user.username}! On ${client.guilds.size} servers and ${client.users.size} users.`);

  /* GAME & STATS */
  client.botUtil.updateGame(client);

  /* WE LOAD THE DASHBOARD */
  dashboard.load();

  /* IF SERVERS GOT INVITED */
  client.guilds.filter(g => !client.servers.has(g.id)).forEach((g) => {
    const config = {
      channel_welcome: 'NOT_SET',
      channel_serverlog: 'NOT_SET',
      channel_modlog: 'NOT_SET',
      channel_phone: 'NOT_SET',
      message_welcome: 'NOT_SET',
      message_leaving: 'NOT_SET',
      action_bannedword: 'NOT_SET',
      switch_welcome: 0,
      switch_serverlog: 0,
      switch_modlog: 0,
      switch_clearbackup: 0,
      switch_phonebook: 1,
      roleme: [],
      auto_role_join: [],
      custom_prefixes: [],
      moderation: [],
      imported_tags: [],
      ignored_channels: [],
      blacklisted_numbers: [],
      banned_words: [],
      timezone: 'UTC',
      locale: 'en',
    };
    client.servers.set(g.id, config);
    console.log(`[Servers] Created (lately) the configuration file for ${g.name} (ID:${g.id})`);
  });

  /* WE REMOVE NUMBERS FROM DELETED GUILDS */
  client.numbers.filter(gid => !client.guilds.has(gid)).forEach((guild, number) => {
    client.numbers.delete(number);
    console.log(`[Numbers] Deleted number for ${guild} (deleted guild).`);
  });

  /* WE SET THE NECESSARY TIMEOUTS */
  client.timeout.forEach((data, index) => {
    if (data.end < Date.now()) return client.timeout.delete(index);
    setTimeout(client.botUtil.reminderTimeout(client, data), data.end - Date.now());
  });

  /* CLEVERBOT SHIT */
  snekfetch.post('https://cleverbot.io/1.0/create')
    .send({
      user: config.api.cleverbot_user,
      key: config.api.cleverbot_key,
      nick: 'iBot',
    })
    .then((response) => {
      const parsed = JSON.parse(response.text);
      if (parsed.status !== 'success') return console.error(parsed.status);
    });
};
