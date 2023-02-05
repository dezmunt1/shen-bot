import { CommonActions } from '../actions/common';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { Postme } from '../contracts';
// const correctMessageId = (ctx) => {
//   const messageId = ctx.callbackQuery
//     ? ctx.callbackQuery.message.message_id
//     : !ctx.message
//     ? ctx.channelPost.message_id
//     : ctx.message.message_id;
//   return messageId;
// };

// const inlineKeyboard = (buttons) => {
//   function getButtons(buttonArray) {
//     const button = buttonArray.map((btn, row, arr) => {
//       const [caption, action] = btn;
//       if (typeof caption !== 'string') {
//         return getButtons(btn);
//       }
//       const correctButton =
//         arr === buttons
//           ? [Markup.callbackButton(caption, action)]
//           : Markup.callbackButton(caption, action);

//       return correctButton;
//     });
//     return button;
//   }
//   const buttonsArr = getButtons(buttons);
//   return Markup.inlineKeyboard(buttonsArr).extra();
// };

export const resourceList = (
  resources: Postme[],
  selectResourceAction: string,
) => {
  const buttons = resources.map((resource) => {
    const { chatType, title, username, chatId } = resource.chat;
    let resourceIcon =
      chatType === 'channel'
        ? '📣'
        : chatType === 'group'
        ? '🗣'
        : chatType === 'supergroup'
        ? '🗣'
        : chatType === 'private'
        ? '👩🏻‍💻'
        : ' ';

    if (resource.protected) {
      resourceIcon = `🔐 ${resourceIcon}`;
    }
    return [
      {
        text: `${resourceIcon} ${title ?? username}`,
        callback_data: `${selectResourceAction}:${chatId}:${Boolean(
          resource.protected,
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
