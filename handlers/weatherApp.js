const axios = require('axios');
const {cityIn} = require('lvovich');




module.exports = ctx => {
  const TOKEN = process.env.TOKEN_WEATHER;
  const city = ctx.match[0].slice(7);
  const selectCity = cityIn(city)[0].toUpperCase() + cityIn(city).slice(1);
  const URL = encodeURI(`https://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${TOKEN}`);
  axios({
    method:'get',
    url: URL
  })
    .then((respon) => {
      const temp = respon.data.main.temp - 273.15;
      ctx.reply(`В городе ${selectCity} сейчас ${Math.round(temp)} ℃`);
      return;
    })
    .catch( (error) => {
      console.log(error);
      if (error.response.status === 404) {
        ctx.reply(`Город "${city}" не найден! Проверьте правильность написания и попробуйте снова.`)
      }
    });
};




