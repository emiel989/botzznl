module.exports = async (client, oldMessage, newMessage) => {
  if (oldMessage.author.bot) return;
  if (!oldMessage.guild) return;
  const config = client.servers.get(oldMessage.guild.id);
  client.I18n.use(config.locale);

  if ((oldMessage.content === newMessage.content) || (oldMessage.embeds.size !== newMessage.embeds.size)) return;

  if (!oldMessage.content || !newMessage.content || oldMessage.content.length >= 1024 || newMessage.content.length >= 1024) return;
  const { MessageEmbed } = require('discord.js');
  const embed = new MessageEmbed()
    .addField(client.I18n.translate`Old content`, oldMessage.content)
    .addField(client.I18n.translate`New content`, newMessage.content)
    .setFooter(`ID: ${oldMessage.id}`)
    .setColor('RED');

  client.modUtil.Serverlog(client, oldMessage.guild, client.I18n.translate`✍ **${oldMessage.author.tag}** edited their message from ${oldMessage.channel.toString()} :`, { embed });
};
