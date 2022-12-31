const Markup = require('telegraf/markup');

const correctMessageId = (ctx) => {
  const messageId = ctx.callbackQuery
    ? ctx.callbackQuery.message.message_id
    : !ctx.message
    ? ctx.channelPost.message_id
    : ctx.message.message_id;
  return messageId;
};

const inlineKeyboard = (buttons) => {
  function getButtons(buttonArray) {
    const button = buttonArray.map((btn, row, arr) => {
      const [caption, action] = btn;
      if (typeof caption !== 'string') {
        return getButtons(btn);
      }
      const correctButton =
        arr === buttons
          ? [Markup.callbackButton(caption, action)]
          : Markup.callbackButton(caption, action);

      return correctButton;
    });
    return button;
  }
  const buttonsArr = getButtons(buttons);
  return Markup.inlineKeyboard(buttonsArr).extra();
};

const pagination = (arr, options) => {
  const { page, resourceCbAction, paginationCbAction } = options;
  const cbBtns = [];

  if (arr) {
    const correctArray = arr.slice(0, 5);
    correctArray.forEach((resource) => {
      const locked = resource.postme.passwordRequired;
      let resourceType =
        resource.chatType === 'channel'
          ? '📣'
          : resource.chatType === 'group'
          ? '🗣'
          : resource.chatType === 'supergroup'
          ? '🗣'
          : resource.chatType === 'private'
          ? '👩🏻‍💻'
          : ' ';

      resourceType = locked ? '🔐 ' + resourceType : resourceType;
      cbBtns.push([
        {
          text: `${resourceType} ${resource.title || resource.username}`,
          callback_data: `${resourceCbAction}:${resource.chatID}`,
          hide: false,
        },
      ]);
    });
  }

  const leftArrow = page === 0 ? '⏺' : '⬅️';
  const rightArrow = arr.length < 6 ? '⏺' : '➡️';

  const leftCbData =
    leftArrow === '⏺' ? 'plug' : `${paginationCbAction}:${page - 1}`;
  const rightCbData =
    rightArrow === '⏺' ? 'plug' : `${paginationCbAction}:${page + 1}`;

  cbBtns.push([
    { text: `${leftArrow}`, callback_data: leftCbData, hide: false },
    { text: `Page ${page + 1}`, callback_data: 'plug', hide: false },
    { text: `${rightArrow}`, callback_data: rightCbData, hide: false },
  ]);
  cbBtns.push([
    { text: `👋 Выход 👋 `, callback_data: 'common:exitScene', hide: false },
  ]);
  return cbBtns;
};

module.exports = {
  correctMessageId,
  inlineKeyboard,
  pagination,
};
