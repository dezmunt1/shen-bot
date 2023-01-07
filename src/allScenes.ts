import { Scenes } from 'telegraf';
import delorianScenes from './handlers/delorian/delorian.scene';
import postmeScenes from './handlers/postme/postme.scene';
import { BotContext } from './types';

export const stage = new Scenes.Stage<BotContext>(
  [...delorianScenes, ...postmeScenes],
  {
    ttl: 20,
  },
);
