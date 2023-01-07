import { Context } from 'telegraf';
import { postmeMongoListener } from '../DB/mongo/mongoListener';

interface ExternalData {
  errMessage: string;
  extra: {
    chatId?: number;
  }
}

export default (externalObject: ExternalData, ctx: Context) => {
  const {errMessage, extra} = externalObject;
  const { chatId } = extra;
  if (errMessage !== 'CHANNEL_PRIVATE') return;

  // if (chatId) { TODO: Вернуться когда будут работы с юзерботом
  //   postmeMongoListener(ctx, { adding: true, privateProblem: true }).then(
  //     (d) => {
  //       ctx.telegram.sendMessage(chatId, d);
  //     },
  //   );
  // }
};
