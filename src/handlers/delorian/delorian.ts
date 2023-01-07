import { Markup, NarrowedContext } from 'telegraf';
import { Update, Message } from 'telegraf/typings/core/types/typegram';
import { BotContext } from '@app/types';

export const delorian = async (
  ctx: NarrowedContext<
    BotContext,
    {
      message: Update.New & Update.NonChannel & Message.TextMessage;
      update_id: number;
    }
  >,
) => {
  try {
    ctx.deleteMessage(ctx.message?.message_id);

    await ctx.reply(
      'Добро пожаловать в Delorian, чем могу быть полезен?',
      Markup.inlineKeyboard([
        Markup.button.callback('🚀 Отправить в будущее', 'sendFuture'),
      ]),
    );
  } catch (error) {
    console.error((error as Error).message);
  }
};

export default delorian;
