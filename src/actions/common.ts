import { BotContext } from '../contracts';
import { Composer } from 'telegraf';

export const commonActions = new Composer<BotContext>();

export enum CommonActions {
  Skip = 'common:skip',
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

commonActions.action(CommonActions.Skip, async (ctx) => {
  await ctx.answerCbQuery();
});
