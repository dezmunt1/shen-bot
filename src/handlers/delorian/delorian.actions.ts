import { BotContext } from '@app/types';
import { Composer } from 'telegraf';

export const delorianActions = new Composer<BotContext>();

delorianActions.action('sendFuture', (ctx) => {
  try {
    ctx.scene.enter('sendFuture');
    console.log('Вход в сцену sendFuture');
  } catch (e) {
    ctx.answerCbQuery('Этот опрос не актуален, введите /delorian еще раз');
  } finally {
    ctx.answerCbQuery();
  }
});

export default delorianActions;
