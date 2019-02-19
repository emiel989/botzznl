const donators = require('../../donators.json');

exports.execute = async (client, ctx) => {
  const string = `\`\`\`${donators.map(a => `- ${client.users.get(a.id).tag || a.id} (${a.amount})`).join('\n')}\`\`\``;
  ctx.channel.send(client.I18n.translate`💰 Thanks to these people for having contribued ❤\n${string}\nContribue to iBot development on our PayPal! You can get a custom command for free! <https://paypal.me/ibotandidroid>`);
};

exports.conf = {
  name: 'donators',
  aliases: [],
  public: true,
};
