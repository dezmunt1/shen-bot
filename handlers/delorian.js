const Markup = require('telegraf/markup');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const Composer = require('telegraf/composer');
const Scene = require('telegraf/scenes/base');

let mess = {};
let pess = {};

function correctTime(date) {
    // 22.11.1991 в 22.00
    let abc = date.split('в')
                .map(elem => {
                    return elem.split('.')
                });
    abc = abc[0].concat(abc[1]);
    console.log(abc)

    let presentTime = new Date();
    let futureTime = new Date(abc[2], +abc[1]-1, abc[0], abc[3], abc[4]);
    console.log(futureTime, presentTime);
    if (futureTime < presentTime) {
        return false
    } else {
        return futureTime;
    }

}

correctTime('22.11.1991 в 22.00');


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
    
    const sendFutureScene = new Scene('sendFuture');
    sendFutureScene.enter(ctx => {
        ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, 'Введите отправляемый текст', Markup.inlineKeyboard([
                Markup.callbackButton('Выйти', 'exitScene')]).extra())
                    .then(ctx_then =>{
                        mess['chat_id'] = ctx_then.chat.id;
                        mess['message_id'] = ctx_then.message_id;
                        console.log(mess);
                    })
                }
    );
    sendFutureScene.on('text', ctx => {
        if(!ctx.message.text.match(/\d{1,2}\.\d{1,2}\.\d{4}\sв\s\d{1,2}\.\d{1,2}/g)) {
            ctx.deleteMessage(ctx.message.message_id)
                .then((aaa)=> {
                    ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, 'Должна быть запись в формате ДД.ММ.ГГГГ в ЧЧ.ММ', Markup.inlineKeyboard([
                        Markup.callbackButton('Выйти', 'exitScene')]).extra())
                        .then(ctx_then => {
                            mess['chat_id'] = ctx_then.chat.id;
                            mess['message_id'] = ctx_then.message_id;
                            mess['text'] = ctx_then.text;
                        })
                        .catch(err =>{
                            if (err.on.payload.text === mess.text) { // если сообщение не изменялось
                                console.log('Текс не изменялся');
                            }
                        })
            });
        } else {
            ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, 'Все отлично')
                    .then(ctx_then =>{
                        let time = correctTime(ctx.message.text);
                        console.log(time);
                        if (time) ctx.reply(`Вам напомнят ${time}`);
                        mess['chat_id'] = ctx_then.chat.id;
                        mess['message_id'] = ctx_then.message_id;
                        console.log('Exiting');
                        ctx.scene.leave();
                    })
        }
    });
    

    
    
    const stage = new Stage();
    bot.use(session());
    stage.register(sendFutureScene);
    bot.use(stage.middleware());

    bot.action('sendFuture', (ctx) => {ctx.scene.enter('sendFuture')});
    bot.action('exitScene', (ctx) => {
        console.log('Exit');
        ctx.scene.leave();
    });
};
