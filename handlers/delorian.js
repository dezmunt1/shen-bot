const Markup = require('telegraf/markup');
const {correctTime, formatDate} = require('../utils/dateTransform');
const Scene = require('telegraf/scenes/base');
const {DelorianModel} = require('../models/schemas');
const {userMongoListener} = require('../utils/mongoDB/mongoListener');

let mess = {};
const replys = (ctx) => {
    ctx.deleteMessage(ctx.message.message_id);
    ctx.reply('Добро пожаловать в Delorian, чем могу быть полезен?', Markup.inlineKeyboard([
        Markup.callbackButton('🚀 Отправить в будущее', 'sendFuture')
    ]).extra())
        .then(ctx_then =>{
            mess['chat_id'] = ctx_then.chat.id;
            mess['message_id'] = ctx_then.message_id;
            return userMongoListener(ctx);
        })
        .then((res) => {
            mess['gmt'] = res.gmt;
        })
        .catch(err => console.log(err));
    return new Promise((res,rej)=>{
        res(ctx);
    })
};

const sendFutureScene = new Scene('sendFuture');
    sendFutureScene.enter(ctx => {
        console.log(mess);
        timerExit(ctx);   // если 3 минуты бездействешь, автовыход из сцены
        ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, 'Введите дату отправления', Markup.inlineKeyboard([
                Markup.callbackButton('Выйти', 'exitScene')]).extra())
                    .then(ctx_then => {
                        mess['chat_id'] = ctx_then.chat.id;
                        mess['message_id'] = ctx_then.message_id;
                        console.log(mess);
                    })
                    .catch(err => {
                        if (err.code === 400) {
                            ctx.answerCbQuery('Этот опрос не актуален, введите /delorian еще раз', false);
                        }
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
            let time = correctTime(ctx.message.text, mess.gmt);
            if (time) {
                let date = formatDate(time); // Запишем в формат ДД.ММ.ГГГГ ЧЧ.ММ
                mess['time'] = `${date.date}.${date.month}.${date.year} ${date.hours}.${date.min}`;
                ctx.scene.enter('enteringText');     //Вход в сцену ВВОДА ТЕКСТА
                console.log('Exiting Scene 1');
                ctx.scene.leave();
            } else {
                ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, 'В прошлое сообщений я не отправляю. Чтобы попробовать еще раз, введите `/delorian`')
                    .then(ctx_then => {
                        mess['chat_id'] = ctx_then.chat.id;
                        mess['message_id'] = ctx_then.message_id;
                        ctx.scene.leave();
                    })
                    .catch(err =>{
                        if (err.on.payload.text === mess.text) { // если сообщение не изменялось
                            console.log('Текс не изменялся');
                        }
                    })
                
            }

            
        }
    });

const enteringText = new Scene('enteringText');
enteringText.enter(ctx => {
    ctx.deleteMessage(ctx.message.message_id);
    ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, 'Введите отправляемый текст', Markup.inlineKeyboard([
            Markup.callbackButton('Выйти', 'exitScene')]).extra())
                .then(ctx_then =>{
                    mess['chat_id'] = ctx_then.chat.id;
                    mess['message_id'] = ctx_then.message_id;
                    console.log(mess);
                })
            }
);
enteringText.on('text', ctx => {
    ctx.deleteMessage(ctx.message.message_id);
    ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, 'Увидимся в будущем')
        .then(ctx_then => {
        let futureMessage = new DelorianModel( {
                chatId: ctx.chat.id,
                userId: 123,
                messageId: ctx.message.message_id,
                remindTime: mess.time,
                text: ctx.message.text,
                performed: false
            });
            futureMessage.save((err, futureMessage)=>{
                if (err) console.error(err);
            })
            console.log('Exiting Scene 2');
            ctx.scene.leave();
        })
    }
);

function timerExit(ctx) {
    const ctxSec = ctx;
    let fiveMinutes = setTimeout(function(ctxSec){
        ctx.scene.leave();
        console.log('Выхожу из сцены');
        ctx.telegram.editMessageText(ctxSec.callbackQuery.message.chat.id, ctxSec.callbackQuery.message.message_id, null, 'Вы слишком долгий, введите заново /delorian');
        clearTimeout(fiveMinutes);
    }, 1000 * 60 * 3, ctxSec);
}

module.exports = {
    sendFutureScene,
    enteringText,
    replys
};
