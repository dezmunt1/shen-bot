
const fs = require('fs');
const Extra = require('telegraf/extra');
const {articleMongoListener} = require('../utils/mongoListener');
const articleParser = require('../utils/articleParser')

function random(arr) {
    return arr[Math.floor(Math.random() * (arr.length - 0)) + 0];
}

module.exports = ctx => {
    const articlResource = ctx.match[ctx.match.length-1].toLowerCase();
    if(articlResource === 'хакер') { // здесь надо получить массив и вырвать из него рандомную статью. Есть необходимость чтобы статьи мньше повторялись
        const getArt = articleMongoListener(articlResource, articleParser.xakepParser);
        getArt.then( result => {
                ctx.reply(random(result).link);
            });
        return;
    }

    if(articlResource === 'код дурова' || articlResource === 'код'){
        const getArt = articleMongoListener(articlResource, articleParser.kodParser)
            getArt.then( result => {
                ctx.reply(random(result));
            })
            .catch(err => {
                ctx.reply(`Увы, по запросу <b>"${articlResource}"</b> не доступны сервера. \nОтвет сервера: ${err}`, Extra.HTML(true));
            });    
        return;
    }

    if(articlResource === 'comss' || articlResource === 'комсс'){
        const getArt = articleMongoListener(articlResource, articleParser.comssParser)
            getArt.then( result => {
                ctx.reply(random(result).link);
            });    
        return;
    }

    if(articlResource === 'list' || articlResource === 'список'){
        ctx.reply(`<b>Список доступных ресурсов:</b>\n1. "код" или "код дурова".\n2. "хакер".\n3. "комсс" или "comss".`, Extra.HTML(true));
        return;
    }

    ctx.reply(`Нет статей по запросу <b>"${articlResource}"</b>`, Extra.HTML(true));
};
