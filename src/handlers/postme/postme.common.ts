import { CommonActions } from '../../actions/common';
import { PostmeActions, PostmeAdminActions } from './postme.types';

export const adminOption = [
  {
    text: '⭐ Административный режим',
    callback_data: `${PostmeActions.AdminMode}`,
  },
];

export const adminOptionsKeyboard = [
  [
    {
      text: '📃 Список доступных ресурсов',
      callback_data: `${PostmeAdminActions.AvailableSources}:0`,
    },
  ],
  [
    {
      text: '🗑 Удалить чат из источников',
      callback_data: `${PostmeAdminActions.DeleteResource}`,
    },
  ],
  [
    {
      text: '👋 Выход 👋 ',
      callback_data: CommonActions.ExitCallback,
    },
  ],
];

export const optionsKeyboard = [
  [
    {
      text: '📃 Откуда репостим',
      callback_data: `${PostmeActions.SelectSource}:0`,
    },
  ],
  [
    {
      text: '📌 Выбрать чат как источник',
      callback_data: PostmeActions.SetAsSource,
    },
  ],
  [
    {
      text: '✔️ Выбрать тип контента',
      callback_data: PostmeActions.SelectContentType,
    },
  ],
  [
    {
      text: '🗑 Удалить чат из источников',
      callback_data: PostmeActions.RemoveSource,
    },
  ],
  [
    {
      text: '👋 Выход 👋 ',
      callback_data: CommonActions.ExitCallback,
    },
  ],
];
