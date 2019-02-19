const { server } = require('../../web/index');

exports.execute = async (client, ctx) => {
  server.close(async () => {
    await ctx.channel.send('Goodbye...');
    await client.destroy();
    process.exit(0);
  });
};

exports.conf = {
  name: 'shutdown',
  aliases: [],
  public: false,
};
