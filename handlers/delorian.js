const Markup = require('telegraf/markup');
const {correctTime, formatDate} = require('../utils/dateTransform');
const Scene = require('telegraf/scenes/base');
const {DelorianModel} = require('../models/schemas');
const { userMongoListener, dlMongoListener} = require('../utils/mongoDB/mongoListener');

const replys = async (ctx) => {
  try {
    ctx.deleteMessage(ctx.message.message_id);
    const inviteSended = await ctx.reply('Добро пожаловать в Delorian, чем могу быть полезен?',
      Markup.inlineKeyboard([
        Markup.callbackButton('🚀 Отправить в будущее', 'sendFuture')
      ]).extra());
    const gmt = await userMongoListener(ctx);
    ctx.session.delorian = {
      chatId: inviteSended.chat.id,
      messageId: inviteSended.message_id,
      gmt: gmt.gmt
    };
  } catch (error) {
    console.error(error.message)
  }
  
};

const sendFutureScene = new Scene('sendFuture');

sendFutureScene.enter( (ctx) => {
  timerExit.start(ctx);
  const { chatId, messageId } = ctx.session.delorian;
  ctx.telegram.editMessageText( chatId, messageId, null, 'Введите дату отправления в формате ДД.ММ.ГГГГ в ЧЧ.ММ',
    Markup.inlineKeyboard([
      Markup.callbackButton('Выйти', 'exitScene')
    ])
    .extra())
});

sendFutureScene.on('text', async (ctx) => {
  const isCorrectInput = ctx.message.text.match(/\d{1,2}\.\d{1,2}\.\d{4}\sв\s\d{1,2}\.\d{1,2}/g);
  const { chatId, messageId, gmt } = ctx.session.delorian;

  if ( !isCorrectInput ) {
    await ctx.deleteMessage(ctx.message.message_id);
    return ctx.telegram.editMessageText( chatId, messageId, null, 'Должна быть запись в формате ДД.ММ.ГГГГ в ЧЧ.ММ',
      Markup.inlineKeyboard([
        Markup.callbackButton('Выйти', 'exitScene')
      ])
      .extra()
    );
  };

  const time = correctTime(ctx.message.text, gmt);
  if (time) {
    ctx.session.delorian.userInputDate = new Date( time );
    ctx.scene.enter('enteringText');     //Вход в сцену ВВОДА ТЕКСТА
    ctx.scene.leave();
  } else {
    await ctx.telegram.editMessageText( chatId, messageId, null, 'В прошлое сообщений я не отправляю. Чтобы попробовать еще раз, введите `/delorian`')
    ctx.scene.leave();
  }
});

const enteringText = new Scene('enteringText');

enteringText.enter( async ctx => {
  const { chatId, messageId } = ctx.session.delorian;
  ctx.deleteMessage(ctx.message.message_id);
  await ctx.telegram.editMessageText( chatId, messageId, null, 'Введите отправляемый текст',
    Markup.inlineKeyboard([
      Markup.callbackButton('Выйти', 'exitScene')
    ])
    .extra())
  }
);

enteringText.on('text', async ctx => {
  const { chatId, messageId, userInputDate, gmt } = ctx.session.delorian;

  try {
    ctx.deleteMessage(ctx.message.message_id);
    await ctx.telegram.editMessageText( chatId, messageId, null, 'Увидимся в будущем');
    const futureMessage = new DelorianModel( {
      chatId: chatId,
      userId: ctx.from.id,
      remindTime: userInputDate,
      text: ctx.message.text,
      performed: false,
      gmt
    });
    await futureMessage.save();
    ctx.scene.leave();
    dlMongoListener( ctx, true );
    timerExit.stop();
    ctx.session.delorian = {};
  
  } catch (error) {
    console.log(error.message)
  }
    
});

const timerExit = function() {
  let timerId;
  const start = (ctx) => {
    timerId = setTimeout( () => {
      ctx.scene.leave();
      console.log('Выхожу из сцены');
      ctx.telegram.editMessageText(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.message.message_id, null, 'Вы слишком долгий, введите заново /delorian');
    }, 1000 * 60 * 3, ctx);
  };
  const stop = () => {
    clearTimeout( timerId );
  };
  return { start, stop }
}()

module.exports = {
    sendFutureScene,
    enteringText,
    replys
};
