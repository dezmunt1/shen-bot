import { Markup } from 'telegraf';
import { getUser } from '@app/DB/mongo/mongoListener';
import type { Error } from '@app/types';
import type { DelorianContext } from './delorian.types';

export const replys = async (ctx: DelorianContext) => {
  try {
    ctx.deleteMessage(ctx.message?.message_id);

    const inviteSended = await ctx.reply(
      'Добро пожаловать в Delorian, чем могу быть полезен?',
      Markup.inlineKeyboard([
        Markup.button.callback('🚀 Отправить в будущее', 'sendFuture'),
      ]),
    );

    const gmt = await getUser(ctx);

    ctx.scene.session.delorian = {
      chatId: inviteSended.chat.id,
      messageId: inviteSended.message_id,
      gmt: gmt.gmt,
      userInputDate: new Date(),
    };
  } catch (error) {
    console.error((error as Error).message);
  }
};

export default replys;
