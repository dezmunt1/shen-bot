const Markup = require('telegraf/markup');
const Stage = require('telegraf/stage');
const {correctTime, formatDate} = require('../../utils/dateTransform');
const Scene = require('telegraf/scenes/base');
const {DelorianModel} = require('../../models/schemas');
const {customScenes} = require('../../actions');
const Composer = require('telegraf/composer');

let mess = {};
const replys = (ctx) => {
    ctx.deleteMessage(ctx.message.message_id);
    ctx.reply('Добро пожаловать в Delorian, чем могу быть полезен?', Markup.inlineKeyboard([
        Markup.callbackButton('🚀 Отправить в будущее', 'sendFuture')
    ]).extra())
        .then(ctx_then =>{
            mess['chat_id'] = ctx_then.chat.id;
            mess['message_id'] = ctx_then.message_id;
        })
        .catch(err => console.log(err));
    return new Promise((res,rej)=>{
        res(ctx);
    })
};

const sendFutureScene = new Scene('sendFuture');
    sendFutureScene.enter(ctx => {
        ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, 'Введите дату отправления', Markup.inlineKeyboard([
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
            let time = correctTime(ctx.message.text);
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


module.exports = {
    sendFutureScene,
    enteringText,
    replys
};
