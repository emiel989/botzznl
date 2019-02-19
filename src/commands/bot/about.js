const Discord = require('discord.js');

exports.execute = async (client, ctx) => {
  const embed = new Discord.MessageEmbed()
    .addField(`👤 ${client.I18n.translate`Owner`}`, 'iDroid#4441', true)
    .addField(`🌐 ${client.I18n.translate`Servers`}`, ctx.client.guilds.size, true)
    .addField(`💻 ${client.I18n.translate`RAM Usage`}`, `${Math.round(process.memoryUsage().heapUsed / 1000000)}MB`, true)
    .addField(`⌨ ${client.I18n.translate`Commands ran`}`, client.stats.get('cmdsran'), true)
    .addField('<:node:379701556523565066> node.js', `v${process.versions.node}`, true)
    .addField('<:djs:381347827336609795> discord.js', `v${Discord.version}`, true)
    .addField(`🗨 ${client.I18n.translate`Translators`}`, ':flag_fr: iDroid#4441 - :flag_de: TimNook#4921 - :flag_nl: DismissedGuy#2118 - :flag_pl: KcrPL#4625')
    .addField(`💰 ${client.I18n.translate`Donate`}`, client.I18n.translate`Donate on iBot's PayPal and support its development! [Click here](https://paypal.me/ibotandidroid)`)
    .setColor(ctx.guild.me.displayHexColor)
    .setThumbnail(client.user.displayAvatarURL({ format: 'png', size: 1024 }));

  ctx.channel.send(client.I18n.translate`<:ibot:344781313577844737> Information about **${client.user.username}** :`, { embed });
};

exports.conf = {
  name: 'about',
  aliases: [],
  public: true,
};
