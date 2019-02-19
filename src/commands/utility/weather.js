const snekfetch = require('snekfetch');
const mtz = require('moment-timezone');
const { france } = require('../../helpers/weatherUtil');
const { MessageEmbed } = require('discord.js');

exports.execute = async (client, ctx) => {
  const { locale, timezone } = client.servers.get(ctx.guild.id);
  const location = encodeURIComponent(ctx.args.join(' '));
  if (!location) return ctx.channel.send(client.I18n.translate`❌ You must specify a city to look for!`);
  if (location.length > 1024) return ctx.channel.send(client.I18n.translate`❌ The city length may not exceed 1024 caracters.`);

  const searchResult = await snekfetch.get(`https://maps.googleapis.com/maps/api/geocode/json?key=${client.config.api.geocoder}&new_forward_geocoder=true&address=${location}&language=${locale}`);
  const parsed = JSON.parse(searchResult.text);

  if (parsed.results.length === 0) return ctx.channel.send(client.I18n.translate`❌ The specified city was not found!`);

  /* LOCATIONS */
  const city = parsed.results[0].address_components.find(c => c.types.includes('locality')) ? parsed.results[0].address_components.find(c => c.types.includes('locality')).long_name : client.I18n.translate`Unknown`;
  const department = parsed.results[0].address_components.find(c => c.types.includes('administrative_area_level_2')) ? `${parsed.results[0].address_components.find(c => c.types.includes('administrative_area_level_2')).long_name}, ` : '';
  const region = parsed.results[0].address_components.find(c => c.types.includes('administrative_area_level_1')) ? `${parsed.results[0].address_components.find(c => c.types.includes('administrative_area_level_1')).long_name}, ` : '';
  const country = parsed.results[0].address_components.find(c => c.types.includes('country')) ? parsed.results[0].address_components.find(c => c.types.includes('country')).long_name : client.I18n.translate`Unknown`;

  const weatherResult = await snekfetch.get(`http://api.wunderground.com/api/${client.config.api.weather}/conditions/lang:${locale.toUpperCase()}/q/${parsed.results[0].geometry.location.lat},${parsed.results[0].geometry.location.lng}.json`);
  const weather = JSON.parse(weatherResult.text);

  const embed = new MessageEmbed()
    .addField(client.I18n.translate`🌥 Weather`, weather.current_observation.weather, true)
    .addField(client.I18n.translate`🌡 Temperatures`, client.I18n.translate`**Current:** ${weather.current_observation.temp_c}°C (${weather.current_observation.temp_f}°F)\n**Feels like:** ${weather.current_observation.feelslike_c}°C (${weather.current_observation.feelslike_f}°F)`, true)
    .addField(client.I18n.translate`😎 UV Index`, Math.abs(Math.floor(weather.current_observation.UV)), true)
    .addField(client.I18n.translate`🌬 Wind`, `${weather.current_observation.wind_dir} - ${weather.current_observation.wind_kph}km/h (${weather.current_observation.wind_mph}mi/h)`, true)
    .addField(client.I18n.translate`💦 Humidity`, weather.current_observation.relative_humidity, true)
    .setColor(ctx.guild.me.displayHexColor)
    .setFooter(client.I18n.translate`All information provided by Wunderground API.`, 'http://icons.wxug.com/graphics/wu2/logo_130x80.png')
    .setThumbnail(`https://raw.githubusercontent.com/manifestinteractive/weather-underground-icons/master/dist/icons/white/png/64x64/${weather.current_observation.icon}.png`);

  ctx.channel.send(client.I18n.translate`☀ Weather for **${city}** (${department + region + country}) :`, { embed });

  /* MeteoFrance alerts */
  if (weather.current_observation.display_location.country_iso3166 === 'FR') {
    const { text: response } = await snekfetch.get('http://api.meteofrance.com/files/vigilance/vigilance.json');
    const parsedVigilances = JSON.parse(response);

    const metadata = parsedVigilances.meta.find(meta => meta.zone === 'FR');
    const results = parsedVigilances.data.find(data => data.department === weather.current_observation.display_location.state);
    if (!results || results.level < 2) return;

    const risks = results.risk.map((level, index) => { // eslint-disable-line array-callback-return
      if (level >= 2) {
        return metadata.riskNames[index];
      }
    }).filter(a => a).join(' - ');

    const embedVigilance = new MessageEmbed()
      .setDescription(`**ALERTE ${metadata.colLevels[results.level - 1]}**\nPhénomènes dangereux en cours dans le département ${department.replace(', ', '')}.\n${risks}\nSoyez attentifs aux risques énoncés ci-dessus !\nConsulter [la carte Vigilance Météo-France](http://vigilance.meteofrance.com) pour plus d'informations.`)
      .setThumbnail(`http://api.meteofrance.com/files/vigilance/${metadata.vignette}?anticache=${Date.now()}`)
      .setFooter(`Émission: ${mtz(metadata.dates.dateInsertion).tz(timezone).format('DD/MM/YYYY HH:mm:ss')} - Début: ${mtz(metadata.dates.dateRun).tz(timezone).format('DD/MM/YYYY HH:mm:ss')} - Fin: ${mtz(metadata.dates.datePrevue).tz(timezone).format('DD/MM/YYYY HH:mm:ss')}`, 'https://ibot.idroid.me/images/meteofrance.png')
      .setColor(france.vigilanceColor[results.level]);

    ctx.channel.send({ embed: embedVigilance });
  }
};

exports.conf = {
  name: 'weather',
  aliases: ['forecast'],
  public: true,
};
