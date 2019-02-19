const downloader = require('image-downloader');
const gm = require('gm');

module.exports = async (client, oldUser, newUser) => {
  if (oldUser.bot) return;
  const mutualGuilds = client.guilds.filter(g => g.members.has(newUser.id) && client.servers.get(g.id).switch_serverlog === 1);
  if (mutualGuilds.size === 0) return;
  const timestamp = Date.now();
  let fail = false;

  if (oldUser.avatar !== newUser.avatar) {
    const worker = gm.subClass({ imageMagick: true });

    await downloader.image({
      url: oldUser.displayAvatarURL({ format: 'png', size: 128 }),
      dest: `./tmp/${timestamp}_${oldUser.id}_old.png`,
    }).catch(() => {
      fail = true;
    });

    await downloader.image({
      url: newUser.displayAvatarURL({ format: 'png', size: 128 }),
      dest: `./tmp/${timestamp}_${oldUser.id}_new.png`,
    }).catch(() => {
      fail = true;
    });

    if (fail) return;

    await worker(`./tmp/${timestamp}_${oldUser.id}_old.png`)
      .append(`./tmp/${timestamp}_${oldUser.id}_new.png`, true)
      .write(`./tmp/${timestamp}_${oldUser.id}_final.png`, () => {});
  }

  for (let i = 0, config = client.servers.array()[i]; i < mutualGuilds.size; i += 1) {
    if (config.switch_serverlog === 1) {
      const serverlogChannel = guild.channels.get(config.channel_serverlog);
      if (!serverlogChannel) return;

      if (oldUser.username !== newUser.username) {
        client.I18n.use(config.locale);
        client.modUtil.Serverlog(client, guild, client.I18n.translate`💳 **${newUser.tag}** (ID:${newUser.id}) changed their username from [${oldUser.tag}] to [${newUser.tag}].`);
      }

      if (oldUser.avatar !== newUser.avatar) {
        client.I18n.use(config.locale);
        client.modUtil.Serverlog(client, guild, client.I18n.translate`🖼 **${newUser.tag}** (ID:${newUser.id}) changed their avatar.`, {
          files: [`./tmp/${timestamp}_${oldUser.id}_final.png`],
        });
      }
    }
  }
};
