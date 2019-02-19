exports.execute = async (client, ctx) => {
  const flags = [
    {
      flag: 't',
      name: 'time',
    },
    {
      flag: 'd',
      name: 'description',
    },
    {
      flag: 'c',
      name: 'color',
    },
    {
      flag: 'e',
      name: 'emojis',
    },
  ];

  const args = ctx.args;

  const options = [];
  let finishedTitle = false;
  let title = '';
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('-')) {
      const filter = flags.filter(f => f.flag === args[i].substring(1).toLowerCase());
      if (filter.length > 0) {
        finishedTitle = true;
        const current = filter[0].flag;
        options.push({
          flag: current,
          value: '',
        });
      } else {
        if (finishedTitle === true) { // eslint-disable-line no-lonely-if
          ctx.channel.send(`❌ Unknown argument detected: ${args[i]}.`);
          break;
        }
      }
    } else {
      if (options.length === 0 && finishedTitle === false) { // eslint-disable-line no-lonely-if
        if (title.length === 0) title += args[i];
        else title += ` ${args[i]}`;
      } else {
        const index = options.length - 1;
        if (options[index].value.length === 0) {
          options[index].value = args[i];
        } else {
          options[index].value += ` ${args[i]}`;
        }
      }
    }
  }

  if (!title) return ctx.channel.send(client.I18n.translate`❌ You must put a title for your poll!`);

  const durationParser = require('parse-duration');
  const pollWillExpire = client.I18n.translate`The poll expires on `;
  let timeout = durationParser('60s');
  let emojis = ['👍', '👎'];

  const { MessageEmbed } = require('discord.js');
  const newPollEmbed = new MessageEmbed()
    .setTitle(title)
    .setAuthor(ctx.author.username, ctx.author.displayAvatarURL())
    .setTimestamp(new Date());

  for (const option of options) {
    if (option.flag === 't') {
      timeout = durationParser(option.value);
    }

    if (option.flag === 'd') {
      newPollEmbed.setDescription(option.value);
    }

    if (option.flag === 'c') {
      const color = option.value.toUpperCase();
      newPollEmbed.setColor(color);
    }

    if (option.flag === 'e') {
      const customEmotes = option.value.split(' ');
      if (customEmotes.length >= 2) {
        for (let i = 0; i < customEmotes.length; i++) {
          if (customEmotes[i].length > 6) {
            const e = customEmotes[i].split(':');
            if (e.length === 3) {
              customEmotes[i] = client.emojis.get(e[2].replace('>', ''));
            }
          }
        }
        emojis = customEmotes;
      }
    }
  }

  newPollEmbed.setFooter(`${pollWillExpire}${require('moment-timezone')(Date.now() + timeout).tz('UTC').format('DD/MM/YYYY HH:mm:ss (UTC)')}`);

  const msg = await ctx.channel.send({ embed: newPollEmbed });
  for (const emoji of emojis) {
    if (typeof emoji === 'object') await msg.react(emoji.id);
    else await msg.react(emoji);
  }

  const count = client.timeout.array().length.toString();
  client.timeout.set(count, {
    type: 'POLL',
    timeout,
    end: Date.now() + timeout,
    remindid: count,
    lang: client.servers.get(ctx.guild.id).locale,
    guild: ctx.guild.id,
    message: msg.id,
    channel: ctx.channel.id,
    author: {
      username: ctx.author.username,
      avatar: ctx.author.displayAvatarURL({ size: 128 }),
    },
    pollOptions: {
      title,
      color: options.find(o => o.flag === 'c') ? options.find(o => o.flag === 'c').value : 'GREEN',
    },
  });
  client.setTimeout(() => client.botUtil.reminderTimeout(client.timeout.get(count)), timeout);
};

exports.conf = {
  name: 'poll',
  aliases: [],
  public: true,
};
