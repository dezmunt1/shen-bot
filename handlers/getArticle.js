const axios = require('axios');
const fs = require('fs');
const Extra = require('telegraf/extra');
const TOKEN = process.env.WRAPAPI_TOKEN;

module.exports = ctx => {
    const articlResource = ctx.match[ctx.match.length-1];
    if(articlResource === 'хакер') {
        const URL = encodeURI(`https://wrapapi.com/use/dezmunt1/xakep/news/0.0.5?wrapAPIKey=${TOKEN}`);
        axios({
            method:'post',
            url: URL
        })
            .then((respon) => {
                let newsArr = respon.data.data.news;
                let randomArticle = Math.floor(Math.random() * (newsArr.length - 0)) + 0;
                ctx.reply(newsArr[randomArticle].link);
            })
            .catch( (error) => {
            console.log(error);
            });
        return;
    }
    ctx.reply(`Нет статей по запросу <b>"${articlResource}"</b>`, Extra.HTML(true));
    };
