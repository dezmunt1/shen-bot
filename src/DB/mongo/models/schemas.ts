import { Schema, model } from 'mongoose';
import { hashPasswordSync } from '../../../utils/passwordHash';
import { articleResource } from '../../../handlers/article/article.types';

const articleSchema = new Schema({
  resource: String,
  data: [String],
  funcName: {
    type: String,
    enum: [...articleResource],
  },
  date: Date,
});

const delorianSchema = new Schema({
  chatId: Number,
  userId: Number,
  remindTime: Date,
  text: String,
  performed: Boolean,
  gmt: Number,
});

const respectSchema = new Schema({
  cbId: Number,
  chatId: Number,
  userId: Number,
  messageId: Number,
  text: String,
  like: { type: Number, default: 0 },
  dislike: { type: Number, default: 0 },
});

const adminSchema = new Schema({
  password: {
    type: String,
    default: hashPasswordSync(process.env.DEFAULT_PASSWORD),
  },
});

export const ArticleModel = model('ArticleModel', articleSchema);
export const DelorianModel = model('DelorianModel', delorianSchema);
export const RespectModel = model('RespectModel', respectSchema);
export const AdminModel = model('AdminModel', adminSchema);
