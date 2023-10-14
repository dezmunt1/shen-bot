import { WRONG } from '../../constants';
import { CommonActions } from '../../actions/common';
import { BotContext } from '../../contracts';
import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import {
  addChatAsResource,
  comparePassword,
  setResourceToListening,
} from '../../DB/mongo/postme';

interface SceneState {
  dialogMessageId?: number;
  password?: string;
  recourceChatId?: number;
  attemptions: number;
}

export enum PostmeScene {
  EnterPassword = 'postme:enterPassword',
  ConfirmPassword = 'postme:confirmPassword',
  CheckPassword = 'postme:checkPassword',
}

// Registration
export const enterPasswordScene = new Scenes.BaseScene<BotContext>(
  PostmeScene.EnterPassword,
);

enterPasswordScene.enter(async (ctx) => {
  try {
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
  } catch (error) {
    console.log(error);
  }
});

enterPasswordScene.on(message('text'), async (ctx) => {
  try {
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
  } catch (error) {
    console.log(error);
  }
});

export const confirmPasswordScene = new Scenes.BaseScene<BotContext>(
  PostmeScene.ConfirmPassword,
);

confirmPasswordScene.enter(async (ctx) => {
  try {
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
  } catch (error) {
    console.log(error);
  }
});

confirmPasswordScene.on(message('text'), async (ctx) => {
  try {
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

    if (!ctx.from) {
      await ctx.reply('Отсутствует информация о юзере');
      await ctx.scene.leave();
      return;
    }

    const { id } = ctx.from;

    const errorMessage = await addChatAsResource(chatId, id, password);

    if (errorMessage) {
      await ctx.reply(errorMessage);
      return;
    }
    ctx.reply('Чат успешно добавлен в базу!');
  } catch (error) {
    console.log(error);
  }
});

// Main

export const checkPasswordScene = new Scenes.BaseScene<BotContext>(
  PostmeScene.CheckPassword,
);

checkPasswordScene.enter(async (ctx) => {
  try {
    const editedMessage = await ctx.editMessageText(
      'Чат защищен паролем, ведите пароль чтобы получить доступ:',
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
  } catch (error) {
    console.log(error);
  }
});

checkPasswordScene.on(message('text'), async (ctx) => {
  try {
    const { id: chatId } = ctx.chat;
    const { id: userId } = ctx.from;
    const {
      dialogMessageId,
      recourceChatId,
      attemptions = 1,
    } = ctx.scene.state as SceneState;

    if (!dialogMessageId || !recourceChatId) {
      await ctx.editMessageText(WRONG);
      await ctx.scene.leave();
      return;
    }

    if (attemptions === 3) {
      await ctx.deleteMessage(dialogMessageId);
      await ctx.reply('Превышен лимит, попробуйте позже');
      ctx.scene.leave();
      return;
    }

    const { text } = ctx.message;

    await ctx.deleteMessage();

    const isValidPassword = await comparePassword(text, recourceChatId);

    if (!isValidPassword) {
      ctx.scene.state = {
        ...ctx.scene.state,
        attemptions: attemptions + 1,
      } as SceneState;

      await ctx.telegram.editMessageText(
        chatId,
        dialogMessageId,
        undefined,
        `Неверный пароль, у вас осталось ${3 - attemptions} попыток`,
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

    await ctx.scene.leave();

    const isSuccess = await setResourceToListening(userId, recourceChatId);

    await ctx.deleteMessage(dialogMessageId);

    await ctx.reply(
      isSuccess ? 'Чат успешно выбран' : 'Невозможно выбрать чат',
    );
  } catch (error) {
    console.log(error);
    await ctx.scene.leave();
  }
});

export default [enterPasswordScene, confirmPasswordScene, checkPasswordScene];
