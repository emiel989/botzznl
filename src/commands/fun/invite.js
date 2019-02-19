exports.execute = async (client, ctx) => {
  ctx.channel.send('📧 <https://ibot.idroid.me/invite>');
};

exports.conf = {
  name: 'invite',
  aliases: [],
  public: true,
};
