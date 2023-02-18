import { Document } from 'mongoose';

export interface Chat {
  chatId: number;
  chatType: string;
  maxMsgId: number;
  private: boolean;
  photoLogo: Record<'small' | 'big', string | undefined>;
  username?: string;
  title?: string;
  description?: string;
}

export interface ChatDocument extends Chat, Document {}
