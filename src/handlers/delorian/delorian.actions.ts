import { Composer } from 'telegraf';
import { DelorianContext } from './delorian.types';

export const delorianActions = new Composer<DelorianContext>();

delorianActions.action('sendFuture', (ctx) => {
  try {
    if (!ctx.scene.session.delorian) {
      ctx.answerCbQuery('Этот опрос не актуален, введите /delorian еще раз');
      if (ctx.callbackQuery?.message) {
        ctx.deleteMessage(ctx.callbackQuery?.message.message_id);
      }
      return;
    }
    ctx.scene.enter('sendFuture');
    console.log('Вход в сцену sendFuture');
  } catch (e) {
    ctx.answerCbQuery('Этот опрос не актуален, введите /delorian еще раз');
  }
});

export default delorianActions;
