import { Scenes, Context, Markup } from 'telegraf';
import { timerExit } from '../../utils/scene.utils';
import { postmeMongoListener } from '../../DB/mongo/mongoListener';
import { checkHashPassword } from '../../utils/passwordHash';

interface State {
  messageId: number;
  setPassword: boolean;
}

interface MyContext extends Context {
  scene: Scenes.SceneContextScene<MyContext> & { state: State };
}

// Enter password

export const setPassword = new Scenes.BaseScene<MyContext>('setPassword');

setPassword.enter(async (ctx) => {
  const message = await ctx.reply(
    'Вы хотите установить пароль на свой источник?',
    Markup.inlineKeyboard([
      Markup.button.callback('Не устанавливать', 'postmeSetPassword:false'),
      Markup.button.callback('Установить', 'postmeSetPassword:true'),
    ]),
  );

  ctx.scene.state = {
    ...ctx.scene.state,
    messageId: message.message_id,
  };
});

const chatRegister = new Scenes.BaseScene<MyContext>('chatRegister');

chatRegister.enter(async (ctx) => {
  timerExit.start(ctx, 'Время регистрации истекло, попробуйте еще раз!');
  const { setPassword, chatId, messageId } = ctx.scene.state;
  if (setPassword === 'false') {
    delete ctx.scene.state.setPassword;
    const message = await postmeMongoListener(ctx.scene.state, 'adding');
    const props = editMessageProps([chatId, messageId], message, [
      ['Выйти', 'common:exitScene'],
    ]);
    await ctx.telegram.editMessageText(...props);
    timerExit.stop();
    return ctx.scene.leave();
  }

  const props = editMessageProps(
    [chatId, messageId],
    'Введите пароль для доступа к Вашему чату',
    [['Выйти', 'common:exitScene']],
  );

  const message = await ctx.telegram.editMessageText(...props);

  ctx.scene.state = {
    ...ctx.scene.state,
    messageId: message.message_id,
  };
});

chatRegister.on('text', async (ctx) => {
  ctx.deleteMessage(ctx.message.message_id);
  const isCorrectInput = ctx.message.text.length >= 6;
  const { chatId, messageId } = ctx.scene.state;

  if (!isCorrectInput) {
    const props = editMessageProps(
      [chatId, messageId],
      'Пароль должен быть больше 6 символов',
      [['Выйти', 'common:exitScene']],
    );
    return ctx.telegram.editMessageText(...props);
  }
  ctx.scene.state = {
    ...ctx.scene.state,
    password: ctx.message.text,
  };

  return ctx.scene.enter('confirmPassword', ctx.scene.state);
});

// Confirm password Scene

export const confirmPassword = new Scene('confirmPassword');

confirmPassword.enter(async (ctx) => {
  const { chatId, messageId } = ctx.scene.state;
  const props = editMessageProps([chatId, messageId], 'Повторите пароль', [
    ['Выйти', 'common:exitScene'],
  ]);
  ctx.telegram.editMessageText(...props);
});

confirmPassword.on('text', async (ctx) => {
  ctx.deleteMessage(ctx.message.message_id);
  const { password, chatId, messageId } = ctx.scene.state;
  const confirmPassword = ctx.message.text;

  if (password !== confirmPassword) {
    const props = editMessageProps([chatId, messageId], 'Пароли не совпадают', [
      ['Выйти', 'common:exitScene'],
    ]);
    return ctx.telegram.editMessageText(...props);
  }

  const message = await postmeMongoListener(ctx.scene.state, 'adding');
  const props = editMessageProps([chatId, messageId], message, [
    ['Выйти', 'common:exitScene'],
  ]);
  await ctx.telegram.editMessageText(...props);
  timerExit.stop();
  return ctx.scene.leave();
});

// Authentication Scene

export const auth = new Scene('postmeAuth');

auth.enter(async (ctx) => {
  try {
    const optionsForDb = { ...ctx.scene.state };
    if (
      optionsForDb.hasOwnProperty('isProtected') &&
      optionsForDb.isProtected
    ) {
      const props = editMessageProps(
        [optionsForDb.listenerChatId, optionsForDb.messageId],
        'Введите пароль для доступа к чату',
        [['Выйти', 'common:exitScene']],
      );
      await ctx.telegram.editMessageText(...props);
      return null;
    }
    const selected = await postmeMongoListener(optionsForDb, 'listening');
    await ctx.answerCbQuery(selected, true);
    ctx.deleteMessage(optionsForDb.messageId);
    ctx.scene.leave();
  } catch (error) {
    console.error(error);
  }
});

auth.on('text', async (ctx) => {
  try {
    ctx.deleteMessage(ctx.message.message_id);
    const optionsForDb = { ...ctx.scene.state };
    const password = ctx.message.text;

    const getHash = await postmeMongoListener(
      { listeningChatId: optionsForDb.listeningChatId },
      'getHash',
    );
    const checkPassword = await checkHashPassword(password, getHash.password);

    if (!checkPassword) {
      const props = editMessageProps(
        [optionsForDb.listenerChatId, optionsForDb.messageId],
        'Пароль не верный, попробуйте еще раз',
        [['Выйти', 'common:exitScene']],
      );
      await ctx.telegram.editMessageText(...props);
      return null;
    }

    const selected = await postmeMongoListener(optionsForDb, 'listening');
    const props = editMessageProps(
      [optionsForDb.listenerChatId, optionsForDb.messageId],
      selected,
      [['Выйти', 'common:exitScene']],
    );
    await ctx.telegram.editMessageText(...props);
    ctx.scene.leave();
  } catch (error) {
    console.error(error);
  }
});

function editMessageProps(messageProps, newMessage = '', buttons = []) {
  const [chatId, messageId] = messageProps;
  const buttonsArr = buttons.map((button) => {
    const [caption, action] = button;
    return Markup.callbackButton(caption, action);
  });

  return [
    chatId,
    messageId,
    null,
    newMessage,
    Markup.inlineKeyboard(buttonsArr).extra(),
  ];
}
