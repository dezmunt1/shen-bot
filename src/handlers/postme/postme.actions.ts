import { CommonActions } from '../../actions/common';
import { getUserPermissions, toggleUserPermission } from '../../DB/mongo/user';
import { BotContext } from '@app/types';
import {
  PostmeContent,
  PostmePermissions,
  postmeContents,
} from './postme.types';
import { Composer } from 'telegraf';
import { ChatMember } from 'telegraf/typings/core/types/typegram';
import { PostmeScene } from './postme.scene';

export const postmeActions = new Composer<BotContext>();

export enum PostmeActions {
  SelectSource = 'postme:selectSource',
  SetAsSource = 'postme:setAsSource',
  RemoveSource = 'postme:removeSource',
  SelectContentType = 'postme:selectContentType',

  SetPassword = 'postme:setPassword',
}

postmeActions.action(PostmeActions.SelectSource, async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();
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
});

postmeActions.action(PostmeActions.RemoveSource, async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();
  await ctx.reply('Remove source');
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
