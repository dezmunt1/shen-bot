import { Document } from 'mongoose';
import { UserPermissions } from './common';

export interface User {
  firstName: string;
  userName: string;
  userId: number;
  isBot: boolean;
  lang: string;
  gmt: number;
  permissions: UserPermissions[];
}

export interface UserDocument extends User, Document {}
