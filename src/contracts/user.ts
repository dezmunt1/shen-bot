import { Document } from 'mongoose';
import { UserPermissions } from './common';
import type { Postme } from './postme';

export interface User {
  firstName: string;
  userName: string;
  userId: number;
  isBot: boolean;
  lang: string;
  gmt: number;
  permissions: UserPermissions[];
  selectedPostme?: Postme;
}

export interface UserDocument extends User, Document {}
