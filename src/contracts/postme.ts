import { UserDocument } from './user';
import { Chat } from './chat';
import type { Content, ContentType } from './content';
import { Document } from 'mongoose';

export interface Postme {
  chat: Chat;
  status: 0 | 1;
  password: string;
  protected: boolean;
  createdDate: Date;
  lastUpdateDate: Date;
  subscribers: UserDocument[];
  content: Record<ContentType, Content[]>;
}

export interface PostmeDocument extends Postme, Document {}
