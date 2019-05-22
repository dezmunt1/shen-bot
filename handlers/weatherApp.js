const axios = require('axios');
const fs = require('fs');
const {cityIn, cityFrom} = require('lvovich');
const TOKEN = process.env.TOKEN_WEATHER;



module.exports = ctx => {
  const city = ctx.match[0].slice(7);
  const URL = encodeURI(`https://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${TOKEN}`);
  axios({
    method:'get',
    url:URL
  })
    .then((respon) => {
      let temp = respon.data.main.temp - 273.15;
      ctx.reply(`В городе ${cityIn(city)} сейчас ${Math.round(temp)} ℃`);
      return;
    })
    .catch( (error) => {
      console.log(error);
    });
};




