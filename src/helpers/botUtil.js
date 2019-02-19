const snekfetch = require('snekfetch');
const { MessageEmbed, Collection } = require('discord.js');
const client = require('../../index');

const botUtil = {
  updateGame() {
    client.user.setActivity(`Type ${client.config.discord.prefix}help ! On ${client.guilds.size} servers with ${client.users.size} users.`);
  },

  reminderTimeout(data) {
    client.timeout.delete(data.remindid);
    if (data.type === 'POLL') {
      client.I18n.use(data.lang);
      const channel = client.guilds.get(data.guild).channels.get(data.channel);
      channel.messages.fetch(data.message).then(async (newMsg) => {
        const reacs = new Collection();
        for (let i = 0; i < newMsg.reactions.size; i++) {
          const reac = newMsg.reactions.get(newMsg.reactions.keyArray()[i]);
          reac.users = await reac.users.fetch();
          reacs.set(newMsg.reactions.keyArray()[i], reac);
        }

        const bestVote = reacs.sort((a, b) => (b.users.has(client.user.id) ? b.users.size - 1 : b.users.size) - (a.users.has(client.user.id) ? a.users.size - 1 : a.users.size));
        if (bestVote.size === 0) return;

        const finishedPollEmbed = new MessageEmbed()
          .setTitle(data.pollOptions.title)
          .setColor(data.pollOptions.color)
          .setDescription(bestVote.map(v => `${v.emoji.toString()} (${v.users.has(client.user.id) ? v.users.size - 1 : v.users.size})`).join(' > '))
          .setTimestamp(new Date())
          .setAuthor(data.author.username, data.author.avatar);
        channel.send({ embed: finishedPollEmbed });
      }).catch(() => channel.send(client.I18n.translate`❌ Unable to display poll results! Poll message got deleted (ID:${data.message})`));
    }
  },

  cooldown: new Set(),
};

module.exports = botUtil;
