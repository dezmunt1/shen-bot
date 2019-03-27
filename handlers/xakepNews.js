const axios = require('axios');
const fs = require('fs');

const TOKEN = 'N68qUSOJHHRMTZRHgrXAIBNBmmHR8IwK';

module.exports = ctx => {
    const city = ctx.match[0].slice(7);
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
    };
