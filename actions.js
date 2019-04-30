const Router = require('telegraf/router');
const {enter, leave} = require('telegraf/stage');
const Stage = require('telegraf/stage');
const {respectMongoListener} = require('./handlers/delorian/mongoListener');



const stage = new Stage();

const callbackQuerys = new Router((ctx) => {
    if (!ctx.callbackQuery.data) return;
    return {
        route: ctx.callbackQuery.data
    }
});
;
callbackQuerys.on('sendFuture', (ctx) => {
    ctx.scene.enter('sendFuture');
    console.log('Вход в сцену sendFuture');
});
callbackQuerys.on('exitScene', (ctx) => {
    ctx.answerCbQuery('Ну и не надо', false);
    ctx.scene.leave();
    console.log('Выход из сцены');
});
callbackQuerys.on('like', (ctx) => {
    respectMongoListener(ctx);
    ctx.answerCbQuery('Заебись', false);
});
callbackQuerys.on('dislike', (ctx) => {
    respectMongoListener(ctx);
    ctx.answerCbQuery('Говно', false);
});



module.exports =  callbackQuerys;