import Scene from 'telegraf/scenes/base';
import Markup from 'telegraf/markup';
import redisClient from '../../DB/redis';
import {
  correctMessageId,
  inlineKeyboard,
  pagination,
} from '../../utils/telegram.utils';
import {
  adminMongoListener,
  postmeMongoListener,
} from '../../DB/mongo/mongoListener';

// Add Resource Scene

const chatIdResourceScene = new Scene('addResource');

chatIdResourceScene.enter(async (ctx) => {
  const chatId = ctx.chat.id;
  const messageId = correctMessageId(ctx);
  ctx.deleteMessage(messageId);
  const message =
    'Вы хотите принудительно добавить новый ресурс, введите ID ресурса';
  const post = await ctx.telegram.sendMessage(
    chatId,
    message,
    inlineKeyboard([['Выйти', 'common:exitScene']]),
  );

  ctx.scene.state = {
    dialogChatId: chatId,
    dialogMessageId: post.message_id,
  };
});

chatIdResourceScene.on('text', async (ctx) => {
  try {
    const messageId = correctMessageId(ctx);
    ctx.deleteMessage(messageId);
    const idResource = +ctx.message.text;
    if (!idResource) {
      const { dialogChatId, dialogMessageId } = { ...ctx.scene.state };
      const message = 'ID ресурса должно состоять из цифер';
      const props = editMessageProps([dialogChatId, dialogMessageId], message, [
        ['Выйти', 'common:exitScene'],
      ]);
      ctx.telegram.editMessageText(...props);
      return;
    }

    ctx.scene.leave();
    ctx.scene.enter('passwordRequest', {
      ...ctx.scene.state,
      chatId: idResource,
    });
  } catch (error) {
    console.log(error);
  }
});

const passwordRequestResourceScene = new Scene('passwordRequest');

passwordRequestResourceScene.enter(async (ctx) => {
  const { dialogChatId, dialogMessageId } = { ...ctx.scene.state };
  const message = 'Установить пароль для доступа к ресурсу?';
  const props = editMessageProps([dialogChatId, dialogMessageId], message, [
    [
      ['Нет', 'resourceSetPassword:false'],
      ['Да', 'resourceSetPassword:true'],
    ],
    ['Выйти', 'common:exitScene'],
  ]);
  ctx.telegram.editMessageText(...props);
});

const enterPasswordResourceScene = new Scene('enterPassword');

enterPasswordResourceScene.enter((ctx) => {
  const { dialogChatId, dialogMessageId, setPassword } = { ...ctx.scene.state };
  if (setPassword === 'false') {
    delete ctx.scene.state.setPassword;
    ctx.scene.state.password = false;
    ctx.scene.leave();
    ctx.scene.enter('totalParseAdmin', ctx.scene.state);
    return;
  }

  const message = 'Введите пароль для доступа к ресурсу, не менее 6 символов';
  const props = editMessageProps([dialogChatId, dialogMessageId], message, [
    ['Выйти', 'common:exitScene'],
  ]);
  ctx.telegram.editMessageText(...props);
});

enterPasswordResourceScene.on('text', async (ctx) => {
  const messageId = correctMessageId(ctx);
  ctx.deleteMessage(messageId);
  const password = ctx.message.text;
  const isCorrectInput = password.length >= 6;
  const { dialogChatId, dialogMessageId } = { ...ctx.scene.state };

  if (!isCorrectInput) {
    const props = editMessageProps(
      [dialogChatId, dialogMessageId],
      'Пароль должен быть больше 6 символов',
      [['Выйти', 'common:exitScene']],
    );
    return ctx.telegram.editMessageText(...props);
  }

  ctx.scene.state = {
    ...ctx.scene.state,
    password,
  };

  ctx.scene.leave();
  return ctx.scene.enter('confirmPasswordResourceAdmin', ctx.scene.state);
});

const confirmPasswordResourceScene = new Scene('confirmPasswordResourceAdmin');

confirmPasswordResourceScene.enter((ctx) => {
  const { dialogChatId, dialogMessageId } = { ...ctx.scene.state };
  const props = editMessageProps(
    [dialogChatId, dialogMessageId],
    'Повторите пароль',
    [['Выйти', 'common:exitScene']],
  );
  ctx.telegram.editMessageText(...props);
});

confirmPasswordResourceScene.on('text', (ctx) => {
  const messageId = correctMessageId(ctx);
  ctx.deleteMessage(messageId);
  const { dialogChatId, dialogMessageId, password } = ctx.scene.state;
  const confirmPassword = ctx.message.text;

  if (password !== confirmPassword) {
    const props = editMessageProps(
      [dialogChatId, dialogMessageId],
      'Пароли не совпадают, повторите пароль ещё раз',
      [['Выйти', 'common:exitScene']],
    );
    return ctx.telegram.editMessageText(...props);
  }

  ctx.scene.leave();
  ctx.scene.enter('totalParseAdmin', ctx.scene.state);
});

const totalParseResourceScene = new Scene('totalParseAdmin');

totalParseResourceScene.enter((ctx) => {
  const { dialogChatId, dialogMessageId } = { ...ctx.scene.state };
  const message =
    ' Да - если отпарсить ресурс полностью, Нет - если парсить начиная с настоящего момента';
  const props = editMessageProps([dialogChatId, dialogMessageId], message, [
    [
      ['Нет', 'totalParseAdmin:false'],
      ['Да', 'totalParseAdmin:true'],
    ],
    ['Выйти', 'common:exitScene'],
  ]);
  ctx.telegram.editMessageText(...props);
});

const finishResourceScene = new Scene('finishAddResource');

finishResourceScene.enter((ctx) => {
  const { totalParsing, password, chatId, dialogChatId, dialogMessageId } =
    ctx.scene.state;
  const props = editMessageProps(
    [dialogChatId, dialogMessageId],
    'Данные введены корректно',
    [['Выйти', 'common:exitScene']],
  );
  ctx.telegram.editMessageText(...props);

  const dataToDb = {
    totalParsing,
    chatId,
    chatIdAdmin: ctx.from.id,
    password,
  };
  ctx.scene.leave();
  adminMongoListener(dataToDb, 'addingChat');
});

// Del Resource Scene

const delResourcesListScene = new Scene('delResource');

delResourcesListScene.enter(async (ctx) => {
  const messageId = correctMessageId(ctx);
  ctx.deleteMessage(messageId);

  if (ctx.scene.state.delete) {
    const resourceChatId = ctx.scene.state.resource;
    const deleteResource = await postmeMongoListener(
      { chatId: resourceChatId },
      'delete',
    );
    const message = `[server]: "${resourceChatId}" delete operation. ${
      deleteResource ? 'Success' : 'Denied'
    }!`;

    redisClient.emitter.emit('sendPost', {
      action: 'sendError',
      chatId: process.env.ADMIN_CHAT_ID,
      message,
    });
  }

  const page = ctx.scene.state.page ? ctx.scene.state.page : 0;
  ctx.scene.state.page = page;

  const activeResources = await postmeMongoListener(
    {
      page,
      limit: 5,
    },
    'selectSource',
  );

  const resourceList = pagination(activeResources, {
    page,
    resourceCbAction: 'selectedSourceAdmin',
    paginationCbAction: 'selectSourceAdmin',
  });

  const message = activeResources
    ? '🗑️ <b>Выберите ресурс для удаления:</b>'
    : '🤖Список ресурсов пуст!';

  await ctx.reply(
    message,
    Markup.inlineKeyboard(resourceList).extra({ parse_mode: 'HTML' }),
  );
});

const deleteSelectResourceScene = new Scene('deleteResourceAdmin');

deleteSelectResourceScene.enter((ctx) => {
  const messageId = correctMessageId(ctx);
  const props = editMessageProps(
    [ctx.chat.id, messageId],
    'Вы действительно хотите удалить этот ресурс?',
    [
      [
        ['Нет', 'btnDelResourceAdmin:false'],
        ['Да', 'btnDelResourceAdmin:true'],
      ],
      ['Выйти', 'common:exitScene'],
    ],
  );
  ctx.telegram.editMessageText(...props);
});

export default {
  adminScenes: [
    chatIdResourceScene,
    passwordRequestResourceScene,
    enterPasswordResourceScene,
    confirmPasswordResourceScene,
    totalParseResourceScene,
    finishResourceScene,
    delResourcesListScene,
    deleteSelectResourceScene,
  ],
};

function editMessageProps(messageProps, newMessage = '', buttons = []) {
  const [chatId, messageId] = messageProps;
  const keyBoard = inlineKeyboard(buttons);

  return [chatId, messageId, null, newMessage, keyBoard];
}

// Теряется page в состоянии сцен
// Что то не работает, от дебажить
