import { Document } from 'mongoose';
import type { Postme } from './postme';

export interface Chat {
  chatId: number;
  chatType: string;
  maxMsgId: number;
  private: boolean;
  photoLogo: Record<'small' | 'big', string | undefined>;
  username?: string;
  title?: string;
  description?: string;
  selectedPostme?: Postme;
}

export interface ChatDocument extends Chat, Document {}
