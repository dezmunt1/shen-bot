import { postmeMongoListener } from '../DB/mongo/mongoListener';

export default (data, ctx) => {
  const { errMessage, extra } = data;
  if (errMessage === 'CHANNEL_PRIVATE' && extra.chatId) {
    ctx.chat.id = +extra.chatId;
    postmeMongoListener(ctx, { adding: true, privateProblem: true }).then(
      (d) => {
        ctx.telegram.sendMessage(+extra.chatId, d);
      },
    );
  }
};
