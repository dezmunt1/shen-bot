import { Markup } from 'telegraf';
import { BotContext } from '../../contracts';
import { saveRate } from '../../DB/mongo/respect';
import { WRONG } from '../../constants';

export const respect = async (ctx: BotContext) => {
  if (!ctx.chat) return;
  try {
    const message = await ctx.telegram.sendMessage(
      ctx.chat.id,
      ctx.match[1],
      Markup.inlineKeyboard([
        Markup.button.callback(`👍 0`, 'like'),
        Markup.button.callback(`👎 0`, 'dislike'),
      ]),
    );

    if (!message.from?.id) throw WRONG;

    await saveRate({
      chatId: message.chat.id,
      userId: message.from.id,
      messageId: message.message_id,
      text: message.text,
      like: 0,
      dislike: 0,
    });
  } catch (error) {
    console.log(error);
    ctx.reply(WRONG);
  }
};
