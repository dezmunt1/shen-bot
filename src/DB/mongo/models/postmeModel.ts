import { model, Schema, Types } from 'mongoose';
import { User } from './userModel';
import { Chat } from './chatModel';

interface Postme {
  chat: Chat;
  status: 0 | 1;
  password: string;
  protected: boolean;
  createdDate: Date;
  subscribers: User[];
  content: {
    links: string[];
    photo: string[];
    animation: string[];
    video: string[];
    audio: string[];
    voicenote: string[];
    videonote: string[];
  };
}

const postmeSchema = new Schema<Postme>({
  chat: {
    type: Types.ObjectId,
    ref: 'ChatModel',
  },
  status: {
    type: Number,
    enum: [0, 1],
  },
  password: String,
  protected: Boolean,
  createdDate: Date,
  subscribers: [
    {
      type: Types.ObjectId,
      ref: 'UserModel',
    },
  ],
  content: {
    links: {
      type: Array,
      default: [],
    },
    photo: {
      type: Array,
      default: [],
    },
    animation: {
      type: Array,
      default: [],
    },
    video: {
      type: Array,
      default: [],
    },
    audio: {
      type: Array,
      default: [],
    },
    voicenote: {
      type: Array,
      default: [],
    },
    videonote: {
      type: Array,
      default: [],
    },
  },
});

export const PostmeModel = model<Postme>('PostmeModel', postmeSchema);
