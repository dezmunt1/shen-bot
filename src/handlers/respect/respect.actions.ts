import { BotContext } from '@app/types';
import { updateRate } from '../../DB/mongo/respect';
import { WRONG } from '../../constants';
import { Composer, Markup } from 'telegraf';

type Rate = 'like' | 'dislike';

const AVAILABLE_RATES = ['like', 'dislike'];

export const respectActions = new Composer<BotContext>();

respectActions.action(AVAILABLE_RATES, async (ctx) => {
  try {
    const { id: chatId } = await ctx.getChat();
    const messageId = ctx.callbackQuery.message?.message_id;
    const rateType = 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : '';

    if (!rateType) throw 'Отсутсвует RateType';
    if (!messageId) throw 'Отсутсвует MessageId';

    const rate = await updateRate({
      chatId,
      messageId,
      rate: rateType as Rate,
    });
    ctx.telegram.editMessageText(
      chatId,
      messageId,
      undefined,
      rate.text ?? 'Ошибка',
      Markup.inlineKeyboard([
        Markup.button.callback(`👍 ${rate.like}`, 'like'),
        Markup.button.callback(`👎 ${rate.dislike}`, 'dislike'),
      ]),
    );
    ctx.answerCbQuery('Ваше мнение важно для нас (нет)');
  } catch (error) {
    console.log(error);
    ctx.answerCbQuery(WRONG);
  }
});
