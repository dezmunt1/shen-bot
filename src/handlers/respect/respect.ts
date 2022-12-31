import { Markup } from 'telegraf';
import { RespectModel } from '@app/DB/mongo/models/schemas';
import { ContextWithMatch } from '@app/types';

export const respect = async (ctx: ContextWithMatch) => {
  if (!ctx.chat) return;
  ctx.telegram
    .sendMessage(
      ctx.chat.id,
      ctx.match[1],
      Markup.inlineKeyboard([
        Markup.button.callback(`👍 0`, 'like'),
        Markup.button.callback(`👎 0`, 'dislike'),
      ]),
    )
    .then((ctx_then) => {
      const rate = new RespectModel({
        chatId: ctx_then.chat.id,
        userId: ctx_then.from?.id,
        messageId: ctx_then.message_id,
        text: ctx_then.text,
        like: 0,
        dislike: 0,
      });
      rate.save((err) => {
        if (err) {
          console.error(err);
        }
      });
    });
};

export default respect;
