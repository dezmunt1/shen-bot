import { Scenes, Markup } from 'telegraf';
import { correctTime } from '@app/utils/dateTransform';
import { timerExit } from '@app/utils/scene.utils';
import { dlMongoListener, addDelorianModel } from '@app/DB/mongo/delorian';
import type { DelorianContext } from './delorian.types';

const { leave } = Scenes.Stage;

export const sendFutureScene = new Scenes.BaseScene<DelorianContext>(
  'sendFuture',
);

sendFutureScene.enter((ctx) => {
  timerExit.start(ctx, 'Вы слишком долгий, введите заново /delorian');
  const { chatId, messageId } = ctx.scene.session.delorian;
  ctx.telegram.editMessageText(
    chatId,
    messageId,
    undefined,
    'Введите дату отправления в формате ДД.ММ.ГГГГ в ЧЧ.ММ',
    Markup.inlineKeyboard([
      Markup.button.callback('Выйти', 'common:exitScene'),
    ]),
  );
});

sendFutureScene.on('text', async (ctx) => {
  ctx.deleteMessage(ctx.message.message_id);
  const isCorrectInput = ctx.message.text.match(
    /\d{1,2}\.\d{1,2}\.\d{4}\sв\s\d{1,2}\.\d{1,2}/g,
  );
  const { chatId, messageId, gmt } = ctx.scene.session.delorian;

  if (!isCorrectInput) {
    await ctx.deleteMessage(ctx.message.message_id);
    return ctx.telegram.editMessageText(
      chatId,
      messageId,
      undefined,
      'Должна быть запись в формате ДД.ММ.ГГГГ в ЧЧ.ММ',
      Markup.inlineKeyboard([
        Markup.button.callback('Выйти', 'common:exitScene'),
      ]),
    );
  }

  const time = correctTime(ctx.message.text, gmt);
  if (time) {
    ctx.scene.session.delorian.userInputDate = new Date(time);
    ctx.scene.enter('enteringText'); // Вход в сцену ВВОДА ТЕКСТА
    ctx.scene.leave();
  } else {
    timerExit.stop();
    await ctx.telegram.editMessageText(
      chatId,
      messageId,
      undefined,
      'В прошлое сообщений я не отправляю. Чтобы попробовать еще раз, введите `/delorian`',
    );
    ctx.scene.leave();
  }
});

export const enteringText = new Scenes.BaseScene<DelorianContext>(
  'enteringText',
);

enteringText.enter(async (ctx) => {
  const { chatId, messageId } = ctx.scene.session.delorian;
  await ctx.telegram.editMessageText(
    chatId,
    messageId,
    undefined,
    'Введите отправляемый текст',
    Markup.inlineKeyboard([
      Markup.button.callback('Выйти', 'common:exitScene'),
    ]),
  );
});

enteringText.on('text', async (ctx) => {
  const { chatId, messageId, userInputDate, gmt } = ctx.scene.session.delorian;

  try {
    ctx.deleteMessage(ctx.message.message_id);
    await ctx.telegram.editMessageText(
      chatId,
      messageId,
      undefined,
      'Увидимся в будущем',
    );

    await addDelorianModel({
      chatId,
      userId: ctx.from.id,
      remindTime: userInputDate,
      text: ctx.message.text,
      performed: false,
      gmt,
    });
    ctx.scene.leave();
    timerExit.stop();
    dlMongoListener(ctx, true);
  } catch (error: any) {
    console.log(error.message);
    leave();
  }
});
