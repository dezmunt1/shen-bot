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
    try {
        ctx.scene.enter('sendFuture');
        console.log('Вход в сцену sendFuture');
    } catch(e) { // если нажата кнопка при незапущенной сцене (не найдет зарегистрированной сцены)
        ctx.answerCbQuery('Этот опрос не актуален, введите /delorian еще раз', false);
    };
    
    
});
callbackQuerys.on('exitScene', (ctx) => {
    ctx.deleteMessage(ctx.callbackQuery.message.message_id);
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