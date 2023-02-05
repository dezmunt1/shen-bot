import { CommonActions } from '../../actions/common';
import { getUserPermissions, toggleUserPermission } from '../../DB/mongo/user';
import { BotContext } from '../../contracts';
import {
  PostmeContent,
  PostmePermissions,
  postmeContents,
  PostmeActions,
} from './postme.types';
import { Composer } from 'telegraf';
import { PostmeScene } from './postme.scene';
import {
  addChatAsResource,
  deleteSource,
  getAvailableChats,
  getContent,
  setResourceToListening,
} from '../../DB/mongo/postme';
import { optionsKeyboard } from './postme.common';
import { pagination, resourceList } from '../../utils/telegram.utils';

export const postmeActions = new Composer<BotContext>();

postmeActions.action(PostmeActions.OpenOptions, async (ctx) => {
  await ctx.editMessageText('Настроим репостер ⚙', {
    reply_markup: {
      inline_keyboard: optionsKeyboard,
    },
  });
});

const GetMoreRegex = new RegExp(`${PostmeActions.GetMore}:(.+)`, 'gi');
postmeActions.action(GetMoreRegex, async (ctx) => {
  await ctx.deleteMessage();

  if (!Number.isNaN(ctx.match[1])) {
    await ctx.deleteMessage(+ctx.match[1]);
  }
  const chatId = ctx.chat?.id;
  const userId = ctx.from?.id;

  if (!chatId || !userId) return;

  await getContent({ chatId, userId });
  await ctx.answerCbQuery();
});

const SelectSourceChatRegex = new RegExp(
  `${PostmeActions.SelectSourceChat}:(.+):(.+)`,
  'gi',
);
postmeActions.action(SelectSourceChatRegex, async (ctx) => {
  try {
    if (!ctx.chat) throw 'Невозможно выбрать чат';

    const recourceChatId = ctx.match[1];
    const isProtected = ctx.match[2] === 'true';

    if (isProtected) {
      await ctx.answerCbQuery();
      await ctx.scene.enter(PostmeScene.CheckPassword, {
        recourceChatId,
      });
      return;
    }

    const isSuccess = await setResourceToListening(ctx.chat.id, recourceChatId);

    await ctx.answerCbQuery(
      isSuccess ? 'Чат успешно выбран' : 'Невозможно выбрать чат',
    );
  } catch (error) {
    console.log(error);
    await ctx.answerCbQuery('Невозможно выбрать чат');
  }
});

const SelectSourceRegex = new RegExp(
  `${PostmeActions.SelectSource}:(.+)`,
  'gi',
);
postmeActions.action(SelectSourceRegex, async (ctx) => {
  try {
    const page = Number.isNaN(ctx.match[1]) ? 0 : +ctx.match[1];

    const activeResources = await getAvailableChats(page);
    await ctx.answerCbQuery();

    if (!activeResources.length) {
      await ctx.editMessageText('🤖Список ресурсов пуст!', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔙 Вернуться назад',
                callback_data: PostmeActions.OpenOptions,
              },
            ],
          ],
        },
      });
      return;
    }
    const paginationButtons = pagination({
      action: PostmeActions.SelectSource,
      pageIndex: page,
      listCount: activeResources.length,
    });

    const listButtons = resourceList(
      activeResources,
      PostmeActions.SelectSourceChat,
    );

    ctx.editMessageText('<b>Выберите один из доступных ресурсов:</b>', {
      reply_markup: {
        inline_keyboard: [...listButtons, ...paginationButtons],
      },
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error(error);
  }
});

postmeActions.action(PostmeActions.SetAsSource, async (ctx) => {
  await ctx.answerCbQuery();

  const isPrivate = ctx.chat?.type === 'private';
  const isPrivateGroup = ctx.chat?.type === 'group';
  const isChannel = ctx.chat?.type === 'channel';

  if (isPrivate) {
    await ctx.editMessageText(
      'Нельзя установить личную переписку как источник контента',
    );
    return;
  }

  const userborov = await ctx
    .getChatMember(+process.env.SHEN_VISOR!)
    .catch((e) => console.log(e));

  if (
    !userborov ||
    (userborov && ['left', 'kicked'].includes(userborov.status))
  ) {
    await ctx.editMessageText(
      'Userbot отсутствует в чате, обратитесь к администратору',
    );
    return;
  }

  await ctx.answerCbQuery();

  ctx.editMessageText('Вы хотите установить пароль на свой источник?', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Не устанавливать',
            callback_data: `${PostmeActions.SetPassword}:false`,
          },
          {
            text: 'Установить',
            callback_data: `${PostmeActions.SetPassword}:true`,
          },
        ],
      ],
    },
  });
});

const setPasswordRegex = new RegExp(`${PostmeActions.SetPassword}:(.+)`, 'gi');

postmeActions.action(setPasswordRegex, async (ctx) => {
  const passwordEnable = JSON.parse(ctx.match[1]) as boolean;

  if (passwordEnable) {
    await ctx.scene.enter(PostmeScene.EnterPassword);
    return undefined;
  }

  if (!ctx.chat) {
    await ctx.answerCbQuery('Не возможно выбрать чат как источник');
    await ctx.deleteMessage();
    return;
  }

  const errorMessage = await addChatAsResource(ctx.chat.id);

  if (errorMessage) {
    await ctx.reply(errorMessage);
    return;
  }
  ctx.reply('Чат успешно добавлен в базу!');
});

postmeActions.action(PostmeActions.RemoveSource, async (ctx) => {
  const ERR_MESSAGE = 'Ошибка удаления, обратитесь к администратору';
  if (!ctx.chat) {
    await ctx.answerCbQuery(ERR_MESSAGE);
    return;
  }

  const isDelete = await deleteSource(ctx.chat.id);

  await ctx.editMessageText(isDelete ? 'Ресурс успешно удален' : ERR_MESSAGE);
  await ctx.answerCbQuery();
});

postmeActions.action(PostmeActions.SelectContentType, async (ctx) => {
  if (!ctx.from) {
    await ctx.answerCbQuery();
    return;
  }

  const permissions = await getUserPermissions(ctx.from.id);

  await ctx.answerCbQuery();

  const cbButtons = selectContentButtons(postmePermissions(permissions));

  await ctx.editMessageText('Выберите какой контент вы готовы получать', {
    reply_markup: {
      inline_keyboard: cbButtons,
    },
  });
});

const sourceTypeRegex = new RegExp(
  `${PostmeActions.SelectContentType}:(.+)`,
  'gi',
);

postmeActions.action(sourceTypeRegex, async (ctx) => {
  const action = ctx.match[1] as PostmeContent;

  if (!ctx.from || !postmeContents.includes(action)) {
    await ctx.answerCbQuery();
    return;
  }

  const permission = `postme.${action}` as PostmePermissions;

  const newPermissions = await toggleUserPermission(ctx.from.id, permission);

  await ctx.answerCbQuery();

  const cbButtons = selectContentButtons(postmePermissions(newPermissions));

  await ctx.editMessageText('Выберите какой контент вы готовы получать', {
    reply_markup: {
      inline_keyboard: cbButtons,
    },
  });
});

function checkBox(checked: boolean) {
  return checked ? '✅' : '⬜️';
}

type PostmePermissionsReturned = {
  [P in PostmeContent]: boolean;
};

function postmePermissions(
  permissions: PostmePermissions[],
): PostmePermissionsReturned {
  const result: PostmePermissionsReturned = {
    audio: false,
    photo: false,
    video: false,
    links: false,
    full: false,
  };

  permissions
    .filter((permission) => permission.includes('postme'))
    .map((permission) => permission.split('.')[1] as PostmeContent)
    .forEach((permission) => {
      if (permission in result) result[permission] = true;
    });

  return result;
}

function selectContentButtons(validPermissons: PostmePermissionsReturned) {
  return [
    [
      {
        text: `🖼 Фото ${checkBox(validPermissons.photo)}`,
        callback_data: `${PostmeActions.SelectContentType}:photo`,
      },
      {
        text: `🎥 Видео/GIF ${checkBox(validPermissons.video)}`,
        callback_data: `${PostmeActions.SelectContentType}:video`,
      },
      {
        text: `🔗 Ссылки ${checkBox(validPermissons.links)}`,
        callback_data: `${PostmeActions.SelectContentType}:links`,
      },
    ],
    [
      {
        text: `♾ Любой ${checkBox(validPermissons.full)}`,
        callback_data: `${PostmeActions.SelectContentType}:full`,
      },
      {
        text: `🎵 Аудио ${checkBox(validPermissons.audio)}`,
        callback_data: `${PostmeActions.SelectContentType}:audio`,
      },
    ],
    [
      {
        text: `🔰 Выход 🔰`,
        callback_data: CommonActions.ExitCallback,
      },
    ],
  ];
}
