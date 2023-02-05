import { model, Schema, Types } from 'mongoose';
import { PostmeDocument } from '../../../contracts';

const postmeSchema = new Schema<PostmeDocument>({
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
  lastUpdateDate: Date,
  subscribers: [
    {
      type: Types.ObjectId,
      ref: 'UserModel',
    },
  ],
  content: {
    links: {
      type: [Types.ObjectId],
      default: [],
    },
    photo: {
      type: [Types.ObjectId],
      default: [],
    },
    animation: {
      type: [Types.ObjectId],
      default: [],
    },
    video: {
      type: [Types.ObjectId],
      default: [],
    },
    audio: {
      type: [Types.ObjectId],
      default: [],
    },
    voicenote: {
      type: [Types.ObjectId],
      default: [],
    },
    videonote: {
      type: [Types.ObjectId],
      default: [],
    },
  },
});

export const PostmeModel = model<PostmeDocument>('PostmeModel', postmeSchema);
