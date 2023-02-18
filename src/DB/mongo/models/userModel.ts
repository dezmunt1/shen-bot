import { Schema, Types, model } from 'mongoose';
import { User } from '../../../contracts';

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
      'postme.animation',
      'postme.audio',
      'postme.photo',
      'postme.links',
      'postme.video',
      'postme.videonote',
      'postme.voicenote',
      'postme.full',
    ],
    default: ['postme.full'],
  },
  selectedPostme: {
    type: Types.ObjectId,
    ref: 'PostmeModel',
  },
});

export const UserModel = model<User>('UserModel', userSchema);
