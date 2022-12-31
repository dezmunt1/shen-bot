import { respectMongoListener } from '@app/DB/mongo/mongoListener';
import { Composer } from 'telegraf';

export const respectComposer = new Composer();

respectComposer.action('like', (ctx) => {
  respectMongoListener(ctx);
  ctx.answerCbQuery('Заебись');
});

respectComposer.action('dislike', (ctx) => {
  respectMongoListener(ctx);
  ctx.answerCbQuery('Говно');
});

export default respectComposer;
