import { Scenes, Context } from 'telegraf';

export interface DelorianSession {
  chatId: number;
  messageId: number;
  gmt: number;
  userInputDate: Date;
}

export interface MySession extends Scenes.SceneSessionData {
  delorian: DelorianSession;
}

export interface DelorianContext extends Context {
  scene: Scenes.SceneContextScene<DelorianContext, MySession>;
}
