const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const WizardScene = require('telegraf/scenes/wizard');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const Composer = require('telegraf/composer');


/* function sendFuture(ctx) {
    let msg = ctx.callbackQuery.message;
    ctx.editMessageText('Залупа коня',  Extra.HTML().markup((m) =>
    m.inlineKeyboard([
        m.callbackButton('🚀 Отправить в будущее', 'sendFuture'),
        m.callbackButton('🔭 Посмотреть в будущее', 'watchFuture'),
        m.callbackButton('🔙 Вернуть из будущего', 'backFuture')
        ]))
    );
} */
const mess = {};


module.exports = (ctx, bot) => {
    ctx.reply('Добро пожаловать в Delogrian, чем могу быть полезен?', Markup.inlineKeyboard([
        Markup.callbackButton('🚀 Отправить в будущее', 'sendFuture'),
        Markup.callbackButton('🔭 Посмотреть в будущее', 'watchFuture'),
        Markup.callbackButton('🔙 Вернуть из будущего', 'backFuture')
    ]).extra());
    console.log(ctx);
    

    const delorWizard = new WizardScene('delorWizard', (ctx) => {
        if (!mess.unperformed) {
            ctx.editMessageText('Введите отправляемый текст', Markup.inlineKeyboard([
                Markup.callbackButton('🔙 Назад', 'leaveWizard')]).extra())
                    .then(ctx =>{
                        mess['chat_id'] = ctx.chat.id;
                        mess['message_id'] = ctx.message_id;
                        mess['unperformed'] = 1;
                    });
        } else {
            ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, 'Должна быть запись в формате ДД.ММ.ГГГГ в ЧЧ.ММ', Markup.inlineKeyboard([
                Markup.callbackButton('🔙 Назад', 'leaveWizard')]).extra())
                    .then(ctx =>{
                        mess['chat_id'] = ctx.chat.id;
                        mess['message_id'] = ctx.message_id;
                        mess['unperformed'] = 1;
                    })
                    .catch(err => console.log(err));
        }
        return ctx.wizard.next();
    },
        (ctx) =>{
            if(!ctx.message.text.match(/\d{1,2}\.\d{1,2}\.\d{4}\sв\s\d{1,2}\.\d{1,2}/g)){
                return ctx.wizard.back();
            };
            ctx.reply('Done');
            return ctx.scene.leave()
        });
    
    const stage = new Stage();
    stage.register(delorWizard);
    bot.use(session());
    bot.use(stage.middleware());

    bot.action('sendFuture', (ctx) => ctx.scene.enter('delorWizard'));
    bot.action('leaveWizard', (ctx) => {
        ctx.reply('doneee');
        return ctx.wizard.back();
    });
};
