import mongoose from 'mongoose';
import { hashPasswordSync } from '../../../utils/utils';

const articleSchema = new mongoose.Schema({
  resource: String,
  data: Object,
  funcName: String,
  date: Date,
});

const delorianSchema = new mongoose.Schema({
  chatId: Number,
  userId: Number,
  remindTime: Date,
  text: String,
  performed: Boolean,
  gmt: Number,
});

const respectSchema = new mongoose.Schema({
  cbId: Number,
  chatId: String,
  userId: Number,
  messageId: Number,
  text: String,
  like: Number,
  dislike: Number,
});

const userSchema = new mongoose.Schema({
  firstName: String,
  userName: String,
  userId: Number,
  isBot: Boolean,
  lang: { type: String, default: 'en' },
  gmt: { type: Number, default: 3 },
});

const chatSchema = new mongoose.Schema({
  chatID: Number,
  description: { type: String, default: 'Без описания' },
  photoLogo: Object,
  title: String,
  chatType: String,
  username: String,
  maxMsgId: Number,
  private: Boolean,
  postme: {
    mediaTypes: {
      links: { type: Boolean, default: false },
      photo: { type: Boolean, default: false },
      video: { type: Boolean, default: false },
      audio: { type: Boolean, default: false },
      all: { type: Boolean, default: true },
    },
    content: {
      links: { type: Array, default: [] },
      photo: { type: Array, default: [] },
      animation: { type: Array, default: [] },
      video: { type: Array, default: [] },
      audio: { type: Array, default: [] },
      voicenote: { type: Array, default: [] },
      videonote: { type: Array, default: [] },
    },
    resourceActive: { type: Boolean, default: false },
    listening: { type: Number, default: 0 },
    listeners: { type: Array, default: [] },
    password: { type: String, default: '' },
    passwordRequired: { type: Boolean, default: false },
    dateActive: { type: Date, default: '' },
  },
});

const adminSchema = new mongoose.Schema({
  password: {
    type: String,
    default: hashPasswordSync(process.env.DEFAULT_PASSWORD),
  },
});

export const ArticleModel = mongoose.model('ArticleModel', articleSchema);
export const ChatModel = mongoose.model('ChatModel', chatSchema);
export const DelorianModel = mongoose.model('DelorianModel', delorianSchema);
export const RespectModel = mongoose.model('RespectModel', respectSchema);
export const UserModel = mongoose.model('UserModel', userSchema);
export const AdminModel = mongoose.model('AdminModel', adminSchema);
