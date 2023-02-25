import { CommonActions } from '../actions/common';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Chat, Postme } from '@shenlibs/dto';

type ChatType = 'channel' | 'group' | 'supergroup' | 'private' | undefined;

function getResourceIcon(chatType: ChatType) {
  return chatType === 'channel'
    ? '📣'
    : chatType === 'group'
    ? '🗣'
    : chatType === 'supergroup'
    ? '🗣'
    : chatType === 'private'
    ? '👩🏻‍💻'
    : ' ';
}

export const resourceList = (
  resources: Postme[] | Chat[],
  selectResourceAction: string,
) => {
  const buttons = resources.map((resource) => {
    const isProtected = 'protected' in resource && resource.protected;

    const { chatType, title, username, chatId } =
      'protected' in resource ? resource.chat : resource;

    let resourceIcon = getResourceIcon(chatType as ChatType);

    if (isProtected) {
      resourceIcon = `🔐 ${resourceIcon}`;
    }
    return [
      {
        text: `${resourceIcon} ${title ?? username}`,
        callback_data: `${selectResourceAction}:${chatId}:${Boolean(
          isProtected,
        )}`,
        hide: false,
      },
    ];
  });

  return buttons;
};

interface PaginationOptions {
  pageIndex: number;
  listCount: number;
  action: string;
}

export const pagination = (
  options: PaginationOptions,
): InlineKeyboardButton[][] => {
  const { pageIndex, action, listCount } = options;
  const cbBtns: InlineKeyboardButton[][] = [];

  const leftArrow = pageIndex === 0 ? '⏺' : '⬅️';
  const rightArrow = listCount < 5 ? '⏺' : '➡️';

  const leftCbData =
    leftArrow === '⏺' ? CommonActions.Skip : `${action}:${pageIndex - 1}`;
  const rightCbData =
    rightArrow === '⏺' ? CommonActions.Skip : `${action}:${pageIndex + 1}`;

  cbBtns.push([
    { text: `${leftArrow}`, callback_data: leftCbData },
    { text: `Page ${pageIndex + 1}`, callback_data: CommonActions.Skip },
    { text: `${rightArrow}`, callback_data: rightCbData },
  ]);
  cbBtns.push([
    { text: `👋 Выход 👋 `, callback_data: CommonActions.ExitCallback },
  ]);
  return cbBtns;
};
