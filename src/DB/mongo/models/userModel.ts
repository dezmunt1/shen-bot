import { Schema, model } from 'mongoose';
import type { UserPermissions } from '@app/types';

export interface User {
  firstName: string;
  userName: string;
  userId: number;
  isBot: boolean;
  lang: string;
  gmt: number;
  permissions: UserPermissions[];
}

const userSchema = new Schema<User>({
  firstName: String,
  userName: String,
  userId: Number,
  isBot: Boolean,
  lang: { type: String, enum: ['en', 'ru'], default: 'en' },
  gmt: { type: Number, default: 3 },
  permissions: {
    type: [String],
    enum: [
      'postme.links',
      'postme.photo',
      'postme.video',
      'postme.audio',
      'postme.full',
    ],
    default: ['postme.full'],
  },
});

export const UserModel = model<User>('UserModel', userSchema);
