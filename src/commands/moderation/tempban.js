const durationParser = require('parse-duration');

exports.execute = async (client, ctx) => {
  const duration = durationParser(ctx.args[0]);
  /* MEMBERS FINDER */
  let member;
  const search = ctx.args.join(' ').split(' for ')[0].substring(ctx.args[0].length + 1);
  if (search) {
    if (ctx.mentions.members.size > 0) member = ctx.mentions.members.first();
    else {
      member = client.findersUtil.findMember(ctx.guild, search);
      if (member.size === 0) return ctx.channel.send(client.I18n.translate`❌ Nobody found matching \`${search}\`!`);
      else if (member.size === 1) member = member.first();
      else return ctx.channel.send(client.findersUtil.formatMembers(client, member));
    }
  } else {
    return ctx.channel.send(client.I18n.translate`❌ You must mention or specify a user to ban!`);
  }

  let reason = ctx.args.join(' ').split(' for ').slice(1).join(' for ');
  if (!reason) reason = client.I18n.translate`no reason specified`;

  if (ctx.member.id === member.id) return ctx.channel.send(client.I18n.translate`❌ You cannot ban yourself!`);
  if (!member.bannable || member.roles.highest.comparePositionTo(ctx.guild.me.roles.highest) >= 0) return ctx.channel.send(client.I18n.translate`❌ The specified member (**${member.user.tag}**) cannot be banned!`);
  if (ctx.member.roles.highest.comparePositionTo(member.roles.highest) <= 0) return ctx.channel.send(client.I18n.translate`❌ You cannot ban someone who has a higher role than you!`);

  member.ban(`[TEMPBAN] ${ctx.author.tag}: ${reason} (duration: ${duration})`, 7).then(() => {
    const config = client.servers.get(ctx.guild.id);
    const untildate = require('moment-timezone')(Date.now() + duration).tz(config.timezone).format('DD/MM/YYYY HH:mm:ss');

    config.moderation.push({
      ACTION: `TEMPBAN (${untildate})`,
      AUTHOR: ctx.author.id,
      VICTIM: member.id,
      REASON: reason,
      TIME: new Date().getTime(),
    });
    client.servers.set(ctx.guild.id, config);

    client.modUtil.Modlog(client, ctx.guild, client.I18n.translate`🔨 **${ctx.author.tag}** banned **${member.user.tag}** (ID:${member.id}) until ${untildate}.`, reason);

    const count = client.timeout.array().length.toString();
    client.timeout.set(count, {
      type: 'TEMPBAN',
      timeout: duration,
      end: Date.now() + duration,
      remindid: count,
      author: {
        tag: ctx.author.tag,
      },
      victim: {
        id: member.id,
        tag: member.user.tag,
      },
      guild: ctx.guild.id,
      reason,
    });
    client.botUtil.reminderTimeout(client, client.timeout.get(count));

    return ctx.channel.send(client.I18n.translate`✅ Banned **${member.user.tag}**!`);
  }).catch(e => ctx.channel.send(client.I18n.translate`❌ An error has occured! Please retry.`));
};

exports.conf = {
  name: 'tempban',
  aliases: [],
  public: true,
  user_permission: 'BAN_MEMBERS',
  bot_permission: 'BAN_MEMBERS',
};
