import redisClient from '../redis';
import articleParser from '../../handlers/article/article.util';
import { Markup, Context } from 'telegraf';
import {
  DelorianModel,
  RespectModel,
  ArticleModel,
  UserModel,
  ChatModel,
  AdminModel,
} from './models/schemas';
import toObjectId from './utils';
import { Random } from 'random-js';
import { hashPassword, checkHashPassword } from '../../utils/passwordHash';

const random = new Random();

const respectMongoListener = function (ctx) {
  let thisChatId = ctx.chat.id;
  let thisMessId = ctx.callbackQuery.message.message_id;
  let rate = ctx.callbackQuery.data;

  if (rate == 'like' || rate == 'dislike') {
    RespectModel.findOne(
      { chatId: thisChatId, messageId: thisMessId },
      (err, res) => {
        if (err || res === null) {
          console.log(err);
          return;
        }

        res[rate]++;
        ctx.telegram
          .editMessageText(
            res.chatId,
            res.messageId,
            null,
            res.text,
            Markup.inlineKeyboard([
              Markup.callbackButton(`👍 ${res.like}`, 'like'),
              Markup.callbackButton(`👎 ${res.dislike}`, 'dislike'),
            ]).extra(),
          )
          .catch((err) => {
            if (err.on.payload.text === res.text) {
              console.log('Текст не изменялся');
            }
          });
        res.save((err) => {
          if (err) {
            console.error(err);
          }
        });
      },
    ).catch();
  }
};

const adminMongoListener = async (options, type) => {
  if (type === 'checkPassword') {
    const admin = await AdminModel.findOne();
    const checkPassword = await checkHashPassword(
      options.password,
      admin.password,
    );
    return checkPassword;
  }

  if (type === 'addingChat') {
    const getChat = options.userBotData
      ? await addChatMongoListener({
          id: options.chatId,
          description: options.description || 'Без описания',
          photo: options.photoLogo,
          title: options.title,
          type: options.chatType,
          username: options.username || 'Без имени',
          private: options.private,
          listening: [],
        })
      : await ChatModel.findOne({ chatId: options.chatId });

    if (!getChat && !options.userBotData) {
      redisClient.emitter.emit('getChatInfo', {
        ...options,
        action: 'getChatInfo',
      });
      return;
    }

    const chat =
      typeof getChat === 'string'
        ? await ChatModel.findOne({ chatId: options.chatId })
        : getChat;

    if (chat.postme.resourceActive === true) {
      return 'Чат уже в базе данных';
    }

    chat.postme.resourceActive = true;
    chat.postme.passwordRequired = false;
    chat.postme.dateActive = new Date();

    if (options.password) {
      chat.postme.passwordRequired = true;
      chat.postme.password = await hashPassword(options.password);
    }

    await chat.save();

    if (options.totalParsing) {
      redisClient.emitter.emit('adding', {
        action: 'scrapChat',
        chatId: chat.chatId,
        userbotExist: true,
      });
    }
    return 'Чат добавлен в базу данных';
  }
};

function returnMsgId(ctx) {
  if (!ctx) {
    return 0;
  }
  const msgChannel = ctx.message ? ctx.message.message_id : false;
  const msgGroup = ctx.channelPost ? ctx.channelPost.message_id : false;
  return msgGroup || msgChannel;
}

export {
  respectMongoListener,
  articleMongoListener,
  updateArticleResources,
  getUser,
  addChatMongoListener,
  adminMongoListener,
};
