import { Composer } from 'telegraf';
import { BotContext } from '../../contracts';
import { channelPost } from 'telegraf/filters';
import { adminOption, optionsKeyboard } from './postme.common';
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
    const inline_keyboard = [...optionsKeyboard];

    const isAdmin = process.env.SHEN_ADMIN === ctx.from.id.toString();

    if (isAdmin) {
      const backButton = inline_keyboard.pop();
      inline_keyboard.push(adminOption, backButton!);
    }

    await ctx.reply('Настроим репостер ⚙', {
      reply_markup: {
        inline_keyboard,
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
    const { message, buttons } = await getContent({ chatId, userId });
    if (!message) return;
    await ctx.reply(message, { reply_markup: buttons });
  } catch (error) {
    console.log(error);
  }
});
