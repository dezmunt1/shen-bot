import { Scenes, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { correctTime } from '../../utils/dateTransform';
import { dlMongoListener, addDelorianModel } from '../../DB/mongo/delorian';
import { BotContext } from '../../contracts';
import { getUser } from '../../DB/mongo/user';
import { WRONG } from '../../constants';

const { leave } = Scenes.Stage;

export const sendFutureScene = new Scenes.BaseScene<BotContext>('sendFuture');

sendFutureScene.enter(async (ctx) => {
  try {
    const user = await getUser(ctx);
    const messageId = ctx.callbackQuery?.message?.message_id;
    const chatId = ctx.chat?.id;

    if (!messageId || !chatId) {
      throw WRONG;
    }

    ctx.session.delorian = {
      chatId,
      messageId,
      gmt: user?.gmt ?? 3,
      userInputDate: new Date(),
    };

    ctx.telegram.editMessageText(
      chatId,
      messageId,
      undefined,
      'Введите дату отправления в формате ДД.ММ.ГГГГ в ЧЧ.ММ',
      Markup.inlineKeyboard([
        Markup.button.callback('Выйти', 'common:exitScene'),
      ]),
    );
  } catch (error) {
    console.log(error);
    ctx.scene.leave();
    ctx.answerCbQuery(WRONG);
  }
});

sendFutureScene.on(message('text'), async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.message.message_id);
    const isCorrectInput = ctx.message.text.match(
      /\d{1,2}\.\d{1,2}\.\d{4}\sв\s\d{1,2}\.\d{1,2}/g,
    );
    const { chatId, messageId, gmt } = ctx.session.delorian;

    if (!isCorrectInput) {
      await ctx.deleteMessage(ctx.message.message_id);
      await ctx.telegram.editMessageText(
        chatId,
        messageId,
        undefined,
        'Должна быть запись в формате ДД.ММ.ГГГГ в ЧЧ.ММ',
        Markup.inlineKeyboard([
          Markup.button.callback('Выйти', 'common:exitScene'),
        ]),
      );
      return;
    }

    const time = correctTime(ctx.message.text, gmt);
    if (time) {
      ctx.session.delorian.userInputDate = new Date(time);
      ctx.scene.enter('enteringText'); // Вход в сцену ВВОДА ТЕКСТА
      ctx.scene.leave();
    } else {
      await ctx.telegram.editMessageText(
        chatId,
        messageId,
        undefined,
        'В прошлое сообщений я не отправляю. Чтобы попробовать еще раз, введите `/delorian`',
      );
      await ctx.scene.leave();
    }
  } catch (error) {
    console.log(error);
  }
});

export const enteringText = new Scenes.BaseScene<BotContext>('enteringText');

enteringText.enter(async (ctx) => {
  try {
    const { chatId, messageId } = ctx.session.delorian;
    await ctx.telegram.editMessageText(
      chatId,
      messageId,
      undefined,
      'Введите отправляемый текст',
      Markup.inlineKeyboard([
        Markup.button.callback('Выйти', 'common:exitScene'),
      ]),
    );
  } catch (error) {
    console.log(error);
  }
});

enteringText.on(message('text'), async (ctx) => {
  const { chatId, messageId, userInputDate, gmt } = ctx.session.delorian;

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
    dlMongoListener(ctx, true);
  } catch (error: any) {
    console.log(error.message);
    leave();
  }
});

export default [sendFutureScene, enteringText];
