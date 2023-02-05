import { CommonActions } from '../../actions/common';
import { PostmeActions } from './postme.types';

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
