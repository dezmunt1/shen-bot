const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const WizardScene = require('telegraf/scenes/wizard');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const Composer = require('telegraf/composer');

let mess = {};
let pess = {};


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
    

    const delorWizard = new WizardScene('delorWizard', (ctx, next) => {
        if (!mess.unperformed) {
            ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, 'Введите отправляемый текст', Markup.inlineKeyboard([
                Markup.callbackButton('🔙 Назад', 'leaveWizard')]).extra())
                    .then(ctx_then =>{
                        mess['chat_id'] = ctx_then.chat.id;
                        mess['message_id'] = ctx_then.message_id;
                        mess['unperformed'] = 1;
                        console.log(mess);
                        return ctx.wizard.next();
                    })
                    .catch(err => console.log(err));
        } else {
            ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, 'Должна быть запись в формате ДД.ММ.ГГГГ в ЧЧ.ММ', Markup.inlineKeyboard([
                Markup.callbackButton('🔙 Назад', 'leaveWizard')]).extra())
                    .then(ctx_then =>{
                        mess['chat_id'] = ctx_then.chat.id;
                        mess['message_id'] = ctx_then.message_id;
                        mess['unperformed'] = 1;
                        mess['text'] = ctx_then.text;
                        return ctx.wizard.next();
                    })
                    .catch(err => {
                        if (err.on.payload.text === mess.text) {
                            return ctx.wizard.next();
                        }
                    });
                    
        };
        console.log('Сцена 1', ctx);

    },
        (ctx) =>{
            console.log('Сцена 2');
            console.log('im here', ctx);
            if(!ctx.message.text.match(/\d{1,2}\.\d{1,2}\.\d{4}\sв\s\d{1,2}\.\d{1,2}/g)){
                pess['chat_id'] = ctx.chat.id;
                pess['message_id'] = ctx.message.message_id;
                ctx.deleteMessage(pess.message_id)
                .catch(err => console.log(err));
                ctx.wizard.selectStep(1);
                
            } else {
                ctx.reply('Done');
                mess = {};
                pess = {};
                return ctx.scene.leave();
            };
            console.log(ctx.message.text.match(/\d{1,2}\.\d{1,2}\.\d{4}\sв\s\d{1,2}\.\d{1,2}/g));
            
        });
    
    const stage = new Stage();
    stage.register(delorWizard);
    bot.use(session());
    bot.use(stage.middleware());

    bot.action('sendFuture', (ctx) => ctx.scene.enter('delorWizard'));
    bot.action('leaveWizard', (ctx) => {
        mess = {};
        pess = {};
        return ctx.scene.leave();
    });
};
