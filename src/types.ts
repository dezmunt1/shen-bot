import { Context, Scenes } from 'telegraf';
import { DelorianSession } from './handlers/delorian/delorian.types';
import { Update } from 'telegraf/typings/core/types/typegram';
import {
  PostmePermissions,
  PostmeSession,
} from './handlers/postme/postme.types';

export interface MySessionScene extends Scenes.SceneSessionData {
  delorian: DelorianSession;
  postme: PostmeSession;
}
export interface MySession extends Scenes.SceneSession<MySessionScene> {
  delorian: DelorianSession;
  postme: PostmeSession;
}

export interface BotContext<U = Update> extends Context {
  match: string[];
  session: MySession;
  scene: Scenes.SceneContextScene<BotContext<U>, MySessionScene>;
}

export type UserPermissions = PostmePermissions;
