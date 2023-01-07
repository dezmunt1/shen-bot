import { WRONG } from '../../constants';
import { CommonActions } from '../../actions/common';
import { BotContext } from '@app/types';
import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { addChatAsResource } from '../../DB/mongo/postme';

interface SceneState {
  dialogMessageId?: number;
  password?: string;
}

export enum PostmeScene {
  EnterPassword = 'postme:enterPassword',
  ConfirmPassword = 'postme:confirmPassword',
}

export const enterPasswordScene = new Scenes.BaseScene<BotContext>(
  PostmeScene.EnterPassword,
);

enterPasswordScene.enter(async (ctx) => {
  const editedMessage = await ctx.editMessageText(
    'Введите пароль для доступа к Вашему чату',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Выйти', callback_data: CommonActions.ExitCallback }],
        ],
      },
    },
  );
  if (typeof editedMessage === 'object') {
    ctx.scene.state = {
      ...ctx.scene.state,
      dialogMessageId: editedMessage.message_id,
    };
  }
});

enterPasswordScene.on(message('text'), async (ctx) => {
  const { id: chatId } = ctx.chat;
  const { dialogMessageId } = ctx.scene.state as SceneState;

  if (!dialogMessageId) {
    await ctx.editMessageText(WRONG);
    await ctx.scene.leave();
    return;
  }

  const { text } = ctx.message;

  await ctx.deleteMessage();

  if (text.length < 6) {
    await ctx.telegram.editMessageText(
      chatId,
      dialogMessageId,
      undefined,
      'Пароль должен быть больше или равен 6 символам',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Выйти', callback_data: CommonActions.ExitCallback }],
          ],
        },
      },
    );
    return undefined;
  }

  ctx.session.postme = {
    ...ctx.scene.state,
    password: text,
  };
  ctx.scene.enter(PostmeScene.ConfirmPassword);
});

export const confirmPasswordScene = new Scenes.BaseScene<BotContext>(
  PostmeScene.ConfirmPassword,
);

confirmPasswordScene.enter(async (ctx) => {
  const { dialogMessageId } = ctx.session.postme;
  const chatId = ctx.chat?.id;

  await ctx.telegram.editMessageText(
    chatId,
    dialogMessageId,
    undefined,
    'Повторите пароль еще раз',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Выйти', callback_data: CommonActions.ExitCallback }],
        ],
      },
    },
  );
});

confirmPasswordScene.on(message('text'), async (ctx) => {
  const { password, dialogMessageId } = ctx.session.postme;
  const { id: chatId } = ctx.chat;
  const confirmPassword = ctx.message.text;

  await ctx.deleteMessage();

  if (password !== confirmPassword) {
    await ctx.telegram.editMessageText(
      chatId,
      dialogMessageId,
      undefined,
      'Пароли не совпадают, попробуйте еще раз',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Выйти', callback_data: CommonActions.ExitCallback }],
          ],
        },
      },
    );
    return;
  }

  await ctx.deleteMessage(dialogMessageId);

  const errorMessage = await addChatAsResource(chatId, password);

  if (errorMessage) {
    await ctx.reply(errorMessage);
    return;
  }
  ctx.reply('Чат успешно добавлен в базу!');
});

export default [enterPasswordScene, confirmPasswordScene];
