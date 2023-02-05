import { Schema, model, Types } from 'mongoose';
import { ChatDocument } from '../../../contracts';

const chatSchema = new Schema<ChatDocument>({
  chatId: Number,
  description: String,
  photoLogo: Object,
  title: String,
  chatType: String,
  username: String,
  maxMsgId: Number,
  private: Boolean,
  selectedPostme: {
    type: Types.ObjectId,
    ref: 'PostmeModel',
  },
});

export const ChatModel = model<ChatDocument>('ChatModel', chatSchema);
