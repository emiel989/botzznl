const botConfig = require('../config.json');
const fs = require('fs');
const mtz = require('moment-timezone');
const Discord = require('discord.js');
const snekfetch = require('snekfetch');
const { cooldown } = require('../helpers/botUtil');

/* eslint-disable consistent-return no-param-reassign */
module.exports = async (client, ctx) => {
  client.lastactive.set(ctx.author.id, Date.now().toString());

  /* SECURITY */
  if (ctx.author.bot || !ctx.guild) return;

  /* SETTINGS */
  const config = client.servers.get(ctx.guild.id);
  if (!config) return;

  /* AFK */
  if (client.afk.has(ctx.author.id)) {
    client.I18n.use(config.locale);
    client.afk.delete(ctx.author.id);
    ctx.author.send(client.I18n.translate`👋 Welcome back! I removed your AFK status.`);
  }

  if (ctx.mentions.users.size > 0) {
    ctx.mentions.users.forEach((u) => {
      if (client.afk.has(u.id)) {
        client.I18n.use(config.locale);

        const embed = new Discord.MessageEmbed()
          .addField(client.I18n.translate`💤 **${u.username}** is AFK!`, client.afk.get(u.id))
          .setColor(ctx.guild.me.displayHexColor);

        ctx.channel.send({ embed });
      }
    });
  }

  const activeGuilds = client.stats.get('active');

  /* PREVENT IGNORED CHANNELS */
  if (config.ignored_channels.indexOf(ctx.channel.id) !== -1) return;

  /* CLEVERBOT */
  if (client.cleverbot && (ctx.content.indexOf(`<@${client.user.id}>`) === 0 || ctx.content.indexOf(`<@!${client.user.id}>`) === 0)) {
    if (!activeGuilds.includes(ctx.guild.id)) {
      activeGuilds.push(ctx.guild.id);
      client.stats.set('active', activeGuilds);
    }

    client.I18n.use(config.locale);

    /* COOLDOWN */
    if (cooldown.has(ctx.author.id)) return ctx.channel.send(client.I18n.translate`⚠ Calm down!`);


    const question = ctx.content.split(/ +/g).slice(1).join(' ');
    if (!question) return;
    if (question === 'reset' && client.cs[ctx.author.id] !== undefined) {
      if (!ctx.guild) return;
      client.I18n.use(config.locale);
      delete client.cs[ctx.author.id];
      ctx.channel.send(client.I18n.translate`✅ Your conversation has been erased!`);
    } else {
      ctx.channel.startTyping();
      snekfetch.post('https://cleverbot.io/1.0/ask')
        .send({
          user: botConfig.api.cleverbot_user,
          key: botConfig.api.cleverbot_key,
          nick: 'iBot',
          text: question,
        })
        .then((response) => {
          const parsed = JSON.parse(response.text);

          if (parsed.status !== 'success') {
            ctx.channel.send(parsed.status);
          } else {
            cooldown.add(ctx.author.id);
            setTimeout(() => cooldown.delete(ctx.author.id), 2000);

            ctx.channel.send(parsed.response);
            ctx.channel.stopTyping();
            fs.appendFile('./logs/cleverbot.txt', `======DONE!======\n[${mtz().tz('UTC').format('DD MM YYYY HH:mm:ss')}] ${ctx.author.tag} (ID:${ctx.author.id}) - Guild: ${ctx.guild.name} (ID:${ctx.guild.id}) - Channel: ${ctx.channel.name} (ID:${ctx.channel.id}) - Question: ${question}\n=> Response: ${parsed.response}\n=================`, () => {});
          }
        });
    }
  }

  /* PREFIX CHECKING */
  const prefixes = [client.config.discord.prefix, client.config.discord.prefix.toUpperCase()];
  config.custom_prefixes.forEach(prefix => prefixes.push(prefix));
  let prefix;
  prefixes.forEach((prefix2) => {
    if (ctx.content.indexOf(prefix2) === 0) {
      prefix = prefix2;
    }
  });
  if (!prefix) {
    if (ctx.channel.id !== config.channel_phone) return;
    if (client.calls[ctx.guild.id]) {
      const call = client.calls[ctx.guild.id];
      if (call.state === 1) {
        const called = client.guilds.get(client.numbers.get(call.calling));
        const distantConfig = client.servers.get(called.id);
        const calledPhoneChannel = client.channels.get(distantConfig.channel_phone);
        const nums = {
          sender: ((client.calls[ctx.guild.id].type === 0) ? client.calls[ctx.guild.id].calling : client.calls[called.id].calling),
          receiver: ((client.calls[ctx.guild.id].type === 1) ? client.calls[ctx.guild.id].calling : client.calls[called.id].calling),
        };

        if (!calledPhoneChannel) {
          delete client.calls[called.id];
          delete client.calls[ctx.guild.id];
          ctx.channel.send(client.I18n.translate`☎ Lost connection with \`${call.calling}\`!`);
          const logMsg = `[${mtz().tz(distantConfig.timezone).format('HH:mm:ss')}] - ======LOST CONNECTION======\n\n`;
          fs.appendFile(`./logs/calls/${nums.sender}_${nums.receiver}.txt`, logMsg, () => {});
        } else {
          const textToSend = ctx.cleanContent.split(/ +/g).join(' ');
          const logMsg = `[${mtz().tz(distantConfig.timezone).format('HH:mm:ss')}] - [${client.numbers.findKey(k => k === ctx.guild.id)}] **${ctx.author.tag}** (ID:${ctx.author.id}) - ${ctx.guild.name} : ${textToSend}\n`;
          let msgToSend = `☎ **${ctx.author.tag}** : ${textToSend}`;
          if (ctx.attachments.size > 0) msgToSend += `\n🖇 (${ctx.attachments.size})`;
          ctx.attachments.forEach((a) => {
            msgToSend += `\n**${a.name}** - <${a.url}>`;
          });

          fs.appendFile(`./logs/calls/${nums.sender}_${nums.receiver}.txt`, logMsg, () => {});
          calledPhoneChannel.send(msgToSend);
        }
      }
    }
  } else {
    if (!activeGuilds.includes(ctx.guild.id)) {
      activeGuilds.push(ctx.guild.id);
      client.stats.set('active', activeGuilds);
    }

    /* HANDLING */
    ctx.args = ctx.content.split(/ +/g);
    const command = ctx.args.shift().slice(prefix.length).toLowerCase();

    const cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command));
    if (cmd) {
      /* IF CMD CATEGORY IS FUN OR UTILITY WE PREFER PROFILE'S LOCALE */
      let locale = config.locale;
      if (cmd.conf.category === 'FUN' || cmd.conf.category === 'UTILITY') {
        const profile = client.profiles.get(ctx.author.id);
        if (profile && client.languages[profile.locale]) {
          locale = profile.locale;
        }
      }
      client.I18n.use(locale);

      /* COOLDOWN */
      if (cooldown.has(ctx.author.id)) return ctx.channel.send(client.I18n.translate`⚠ Calm down!`);

      /* BLACKLIST */
      const blacklist = client.config.blacklist.users[ctx.author.id];
      if (blacklist) {
        return ctx.channel.send(client.I18n.translate`⚠ You have been blacklisted - You cannot use iBot commands anymore.\n__Given reason :__ ${blacklist.reason} - __Time :__ ${blacklist.time}`);
      }

      /* IF COMMAND IS PRIVATE */
      if (!cmd.conf.public && ctx.author.id !== client.config.discord.ownerID) return ctx.channel.send(client.I18n.translate`❌ You do not have the permission to execute this command!`);

      /* PERMISSIONS */
      if (cmd.conf.user_permission && !ctx.member.permissions.has(cmd.conf.user_permission)) return ctx.channel.send(client.I18n.translate`❌ You do not have the permission \`${cmd.conf.user_permission}\`!`);
      if (cmd.conf.bot_permission && !ctx.guild.me.permissions.has(cmd.conf.bot_permission)) return ctx.channel.send(client.I18n.translate`❌ I do not have the permission \`${cmd.conf.bot_permission}\`!`);

      /* LOG */
      fs.appendFile('./logs/commands.txt', `[${mtz().tz('UTC').format('DD/MM/YYYY HH:mm:ss')}] Author: ${ctx.author.tag} (ID:${ctx.author.id}) - Guild: ${ctx.guild.name} (ID:${ctx.guild.id}) - Channel: ${ctx.channel.name} (ID:${ctx.channel.id})\r\n${ctx.cleanContent}\r\n--------------------\r\n`, () => {});

      /* COOLDOWN */
      cooldown.add(ctx.author.id);
      setTimeout(() => cooldown.delete(ctx.author.id), 2000);

      /* RUN */
      cmd.execute(client, ctx);
    } else if (config.imported_tags.indexOf(command) !== -1) {
      const args = ctx.args.join(' ');
      const tag = client.tags.get(command);

      const content = tag.content
        .replace(/{args}/g, args)
        .replace(/{randomuser}/g, ctx.guild.members.random().user.username)
        .replace(/{range1-100}/g, Math.floor(Math.random() * 1000))
        .replace(/{guildname}/g, ctx.guild.name)
        .replace(/{guildcount}/g, ctx.guild.memberCount);
      ctx.channel.send(content);
    }
  }
};
