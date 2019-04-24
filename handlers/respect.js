const Markup = require('telegraf/markup');
const Stage = require('telegraf/stage');
const {correctTime, formatDate} = require('../../utils/dateTransform');
const Composer = require('telegraf/composer');
const Scene = require('telegraf/scenes/base');
const mongoose = require('mongoose');
const {DelorianModel} = require('../../models/schemas');

module.exports = (ctx, bot) => {
    
    ctx.reply('Добро пожаловать в Delogrian, чем могу быть полезен?', Markup.inlineKeyboard([
        Markup.callbackButton('🚀 Отправить в будущее', 'sendFuture'),
        Markup.callbackButton('🔭 Посмотреть в будущее', 'watchFuture'),
        Markup.callbackButton('🔙 Вернуть из будущего', 'backFuture')
    ]).extra())
        .then(ctx_then =>{
            mess['chat_id'] = ctx_then.chat.id;
            mess['message_id'] = ctx_then.message_id;
        })
        .catch(err => console.log(err));
    
    
};
