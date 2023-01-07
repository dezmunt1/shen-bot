import { Composer } from 'telegraf';
import { commonActions } from './common';
import { respectActions } from '../handlers/respect/respect.actions';
import { delorianActions } from '../handlers/delorian/delorian.actions';
import { postmeActions } from '../handlers/postme/postme.actions';
import { BotContext } from '@app/types';

export const actionsComposer = new Composer<BotContext>();

actionsComposer.use(commonActions);
actionsComposer.use(respectActions);
actionsComposer.use(delorianActions);
actionsComposer.use(postmeActions);
