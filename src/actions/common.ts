import { Composer, Context, Scenes } from 'telegraf';

export interface ContextWithScene extends Context {
  scene: Scenes.SceneContextScene<ContextWithScene>;
}

export const commonActions = new Composer<ContextWithScene>();

commonActions.action('common:exitScene', (ctx) => {
  if (ctx.callbackQuery?.message?.message_id) {
    ctx.deleteMessage(ctx.callbackQuery.message.message_id);
  }
  ctx.answerCbQuery('Ну и не надо');
  if (ctx.scene.current) {
    ctx.scene.leave();
    console.log('Выход из сцены');
  }
});

export default commonActions;
