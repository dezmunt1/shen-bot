import { BotContext } from '@app/types';
import { Composer } from 'telegraf';

export const commonActions = new Composer<BotContext>();

export enum CommonActions {
  ExitCallback = 'common:exitCallback',
}

commonActions.action(CommonActions.ExitCallback, async (ctx) => {
  if (ctx.callbackQuery?.message?.message_id) {
    ctx.deleteMessage(ctx.callbackQuery.message.message_id);
  }
  if (ctx.scene.current) {
    await ctx.answerCbQuery('Ну и не надо');
    await ctx.scene.leave();
    console.log('Выход из сцены');
    return undefined;
  }
  ctx.answerCbQuery();
});

export default commonActions;
