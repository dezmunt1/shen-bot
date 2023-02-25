import { CommonActions } from '../../actions/common';
import { getUserPermissions, toggleUserPermission } from '../../DB/mongo/user';
import { BotContext } from '../../contracts';
import {
  PostmeContent,
  PostmePermissions,
  postmeContents,
  PostmeActions,
  PostmeAdminActions,
} from './postme.types';
import { Composer } from 'telegraf';
import { PostmeScene } from './postme.scene';
import {
  addChatAsResource,
  deleteSource,
  getAvailableChats,
  getAvailableChatsForParsing,
  getContent,
  setResourceToListening,
} from '../../DB/mongo/postme';
import { optionsKeyboard, adminOptionsKeyboard } from './postme.common';
import { pagination, resourceList } from '../../utils/telegram.utils';

export const postmeActions = new Composer<BotContext>();

postmeActions.action(PostmeActions.AdminMode, async (ctx) => {
  try {
    const isAdmin = process.env.SHEN_ADMIN === ctx.from?.id.toString();

    if (!isAdmin) {
      await ctx.answerCbQuery('Доступ запрещен');
      return;
    }

    await ctx.answerCbQuery('Доступ разрешен');

    await ctx.editMessageText('⭐ репостер - административный режим', {
      reply_markup: {
        inline_keyboard: adminOptionsKeyboard,
      },
    });
  } catch (error) {
    console.log(error);
  }
});

const AvailableSourcesRegex = new RegExp(
  `${PostmeAdminActions.AvailableSources}:(.+)`,
  'gi',
);

postmeActions.action(AvailableSourcesRegex, async (ctx) => {
  try {
    const isAdmin = process.env.SHEN_ADMIN === ctx.from?.id.toString();

    if (!isAdmin) {
      await ctx.answerCbQuery('Доступ запрещен');
      return;
    }

    const page = Number.isNaN(ctx.match[1]) ? 0 : +ctx.match[1];

    const activeResources = await getAvailableChatsForParsing(page);

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
      action: PostmeAdminActions.AvailableSources,
      pageIndex: page,
      listCount: activeResources.length,
    });

    const listButtons = resourceList(
      activeResources,
      PostmeAdminActions.SetAsSources,
    );

    ctx.editMessageText('<b>Выберите один из доступных ресурсов:</b>', {
      reply_markup: {
        inline_keyboard: [...listButtons, ...paginationButtons],
      },
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.log(error);
  } finally {
    await ctx.answerCbQuery();
  }
});

const SetAsSourceAdminRegex = new RegExp(
  `${PostmeAdminActions.SetAsSources}:(.+):(.+)`,
  'gi',
);

postmeActions.action(SetAsSourceAdminRegex, async (ctx) => {
  try {
    const chatId = ctx.match[1];
    await ctx.deleteMessage();
    if (!chatId || Number.isNaN(Number(chatId))) {
      await ctx.reply('Отсутствует chatId');
      return;
    }

    const errorMessage = await addChatAsResource(Number(chatId));

    if (errorMessage) {
      await ctx.reply(errorMessage);
      return;
    }
    ctx.reply('Начинаю парсить!');
  } catch (error) {
    console.log(error);
  }
});

postmeActions.action(PostmeActions.OpenOptions, async (ctx) => {
  try {
    await ctx.editMessageText('Настроим репостер ⚙', {
      reply_markup: {
        inline_keyboard: optionsKeyboard,
      },
    });
  } catch (error) {
    console.log(error);
  }
});

const GetMoreRegex = new RegExp(`${PostmeActions.GetMore}:(.+)`, 'gi');
postmeActions.action(GetMoreRegex, async (ctx) => {
  try {
    await ctx.deleteMessage();

    if (!Number.isNaN(ctx.match[1])) {
      await ctx.deleteMessage(+ctx.match[1]);
    }
    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;

    if (!chatId || !userId) return;

    const errorMessage = await getContent({ chatId, userId });
    if (!errorMessage) return;
    await ctx.reply(errorMessage);
  } catch (error) {
    console.log(error);
  } finally {
    await ctx.answerCbQuery();
  }
});

const SelectSourceChatRegex = new RegExp(
  `${PostmeActions.SelectSourceChat}:(.+):(.+)`,
  'gi',
);
postmeActions.action(SelectSourceChatRegex, async (ctx) => {
  try {
    if (!ctx.chat || !ctx.from) throw 'Невозможно выбрать чат';

    const recourceChatId = ctx.match[1];
    const isProtected = ctx.match[2] === 'true';

    if (isProtected) {
      await ctx.answerCbQuery();
      await ctx.scene.enter(PostmeScene.CheckPassword, {
        recourceChatId,
      });
      return;
    }

    const isSuccess = await setResourceToListening(ctx.from.id, recourceChatId);

    if (isSuccess) {
      await ctx.answerCbQuery('Чат успешно выбран');
      await ctx.deleteMessage();
      return;
    }

    await ctx.answerCbQuery('Невозможно выбрать чат');
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
  try {
    const isPrivate = ctx.chat?.type === 'private';
    // const isPrivateGroup = ctx.chat?.type === 'group';
    // const isChannel = ctx.chat?.type === 'channel';

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
  } catch (error) {
    console.log(error);
  } finally {
    await ctx.answerCbQuery();
  }
});

const setPasswordRegex = new RegExp(`${PostmeActions.SetPassword}:(.+)`, 'gi');

postmeActions.action(setPasswordRegex, async (ctx) => {
  try {
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
  } catch (error) {
    console.log(error);
    await ctx.answerCbQuery();
  }
});

postmeActions.action(PostmeActions.RemoveSource, async (ctx) => {
  try {
    const ERR_MESSAGE = 'Ошибка удаления, обратитесь к администратору';
    if (!ctx.chat) {
      await ctx.answerCbQuery(ERR_MESSAGE);
      return;
    }

    const isDelete = await deleteSource(ctx.chat.id);

    await ctx.editMessageText(isDelete ? 'Ресурс успешно удален' : ERR_MESSAGE);
  } catch (error) {
    console.log(error);
  } finally {
    await ctx.answerCbQuery();
  }
});

postmeActions.action(PostmeActions.SelectContentType, async (ctx) => {
  try {
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
  } catch (error) {
    console.log(error);
    await ctx.answerCbQuery();
  }
});

const sourceTypeRegex = new RegExp(
  `${PostmeActions.SelectContentType}:(.+)`,
  'gi',
);

postmeActions.action(sourceTypeRegex, async (ctx) => {
  try {
    const action = ctx.match[1] as PostmeContent;
    const { username, first_name } = ctx.from ?? {};

    if (!ctx.from || !postmeContents.includes(action)) {
      await ctx.answerCbQuery();
      return;
    }

    const permission = `postme.${action}` as PostmePermissions;

    const newPermissions = await toggleUserPermission(ctx.from.id, permission);

    await ctx.answerCbQuery();

    const cbButtons = selectContentButtons(postmePermissions(newPermissions));

    const userName = username
      ? `@${username}`
      : first_name
      ? `${first_name}`
      : 'nobody';

    await ctx.editMessageText(
      `[${userName}] Выберите какой контент вы готовы получать`,
      {
        reply_markup: {
          inline_keyboard: cbButtons,
        },
      },
    );
  } catch (error) {
    console.log(error);
    await ctx.answerCbQuery();
  }
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
    animation: false,
    audio: false,
    photo: false,
    links: false,
    video: false,
    videonote: false,
    voicenote: false,
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
        text: `🖼 GIF ${checkBox(validPermissons.animation)}`,
        callback_data: `${PostmeActions.SelectContentType}:animation`,
      },
    ],
    [
      {
        text: `🎥 Видео ${checkBox(validPermissons.video)}`,
        callback_data: `${PostmeActions.SelectContentType}:video`,
      },
      {
        text: `🎥 Кругляш ${checkBox(validPermissons.videonote)}`,
        callback_data: `${PostmeActions.SelectContentType}:videonote`,
      },
    ],
    [
      {
        text: `🎵 Аудио ${checkBox(validPermissons.audio)}`,
        callback_data: `${PostmeActions.SelectContentType}:audio`,
      },
      {
        text: `🎵 Войс ${checkBox(validPermissons.voicenote)}`,
        callback_data: `${PostmeActions.SelectContentType}:voicenote`,
      },
    ],
    [
      {
        text: `🔗 Ссылки ${checkBox(validPermissons.links)}`,
        callback_data: `${PostmeActions.SelectContentType}:links`,
      },
      {
        text: `♾ Любой ${checkBox(validPermissons.full)}`,
        callback_data: `${PostmeActions.SelectContentType}:full`,
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
