import { Composer } from 'telegraf';
import { BotContext } from '../../contracts';
import { channelPost } from 'telegraf/filters';
import { optionsKeyboard } from './postme.common';
import { getContent } from '../../DB/mongo/postme';
import { PostmeActions } from './postme.types';

export const postmeComposer = new Composer<BotContext>();

postmeComposer.on('message', async (ctx, next) => {
  try {
    if (ctx.from.id === +process.env.SHEN_VISOR!) {
      await ctx.reply('\u2060', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔄 ЕЩЁ',
                callback_data: `${PostmeActions.GetMore}:${ctx.message.message_id}`,
              },
            ],
          ],
        },
        disable_notification: true,
      });
      return undefined;
    }
    return await next();
  } catch (error) {
    console.log(error);
  }
});

postmeComposer.on(channelPost('text'), async (ctx) => {
  try {
    const [command, options] = ctx.channelPost.text.split(' ');

    if (command !== '/postme' || options !== 'options') return;

    await ctx.deleteMessage();

    await ctx.reply('Настроим репостер ⚙', {
      reply_markup: {
        inline_keyboard: optionsKeyboard,
      },
    });
  } catch (error) {
    console.log(error);
  }
});
postmeComposer.hears(/\/postme options/, async (ctx) => {
  try {
    await ctx.deleteMessage();

    await ctx.reply('Настроим репостер ⚙', {
      reply_markup: {
        inline_keyboard: optionsKeyboard,
      },
    });
  } catch (error) {
    console.log(error);
  }
});

postmeComposer.hears(/\/postme/, async (ctx) => {
  try {
    await ctx.deleteMessage();
    const { id: chatId } = ctx.chat;
    const { id: userId } = ctx.from;
    const errorMessage = await getContent({ chatId, userId });
    if (!errorMessage) return;
    await ctx.reply(errorMessage);
  } catch (error) {
    console.log(error);
  }
});
