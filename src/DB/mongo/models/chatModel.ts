import { Schema, model } from 'mongoose';

export interface Chat {
  chatId: number;
  description: string;
  photoLogo: any[]; // TODO: задать корректный тип
  title: string;
  chatType: string;
  username: string;
  maxMsgId: number;
  private: boolean;
}

const chatSchema = new Schema<Chat>({
  chatId: Number,
  description: String,
  photoLogo: Object,
  title: String,
  chatType: String,
  username: String,
  maxMsgId: Number,
  private: Boolean,
});

export const ChatModel = model<Chat>('ChatModel', chatSchema);
