module.exports = async (client, guild) => {
  if (!Object.keys(client.config.blacklist.guilds).includes(guild.id)) {
    /* LOGGING */
    require('fs').appendFile('./logs/guilds.txt', `[${require('moment-timezone')().tz('UTC').format('DD/MM/YYYY HH:mm:ss')}] LEAVE - ${guild.name} (ID:${guild.id}) - Owner: ${guild.owner.user.tag} (ID:${guild.ownerID}) - Members: ${guild.memberCount} (${guild.members.filter(m => m.user.bot).size} bots) - Creation: ${guild.createdAt.toUTCString()}\r\n`, (err) => {
      if (err) console.error(err);
    });

    /* GAME */
    client.botUtil.updateGame(client);

    /* SERVER CONFIGURATION */
    client.servers.delete(guild.id);

    /* NUMBER */
    if (client.numbers.findKey(k => k === guild.id)) {
      client.numbers.delete(client.numbers.findKey(k => k === guild.id));
    }
  }
};
