import redisClient from '../redis/redisInit';
import articleParser from '../../utils/articleParser';
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
import { hashPassword, checkHashPassword } from '../../utils/utils';

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

const articleMongoListener = async (reqResource, resourceParser) => {
  try {
    if (!reqResource) {
      throw new Error(
        '[articleMongoListener]: Request resource type not specified',
      );
    }

    const articleData = await ArticleModel.findOne({ resource: reqResource });

    if (!articleData) {
      const parsedData = await resourceParser();
      const newRes = new ArticleModel({
        resource: reqResource,
        data: parsedData,
        funcName: resourceParser.name,
        date: new Date(),
      });
      await newRes.save();
      return newRes.data;
    }

    return articleData.data;
  } catch (error) {
    console.error(error.message);
    return undefined;
  }
};

const updateArticleResources = async () => {
  try {
    const allResources = await ArticleModel.find();
    if (!allResources.length) {
      throw new Error(
        '[updateArticleResources]: В БД действующих ресурсов не существует',
      );
    }

    allResources.forEach(async (resourceItem) => {
      const resource = resourceItem.resource;
      const funcName = resourceItem.funcName;
      console.log(`Начинаю парсить "${resource.toUpperCase()}"`);

      const parsedRosource = await articleParser[funcName]();
      const newDate = new Date();

      const requestResourceUpdate = await ArticleModel.updateMany(
        { _id: resourceItem._id },
        {
          date: newDate,
          data: parsedRosource,
        },
      );

      if (requestResourceUpdate.nModified) {
        console.log(
          `[updateArticleResources]: Ресурс "${resource.toUpperCase()}" успешно отпарсен, и записан в БД`,
        );
      }
    });

    return undefined;
  } catch (error) {
    console.error(error.message);
  }
};

const getUser = async (ctx) => {
  try {
    if (!ctx.from) {
      throw `В ${ctx.chat.title} сохранение пользователей в БД не доступно`;
    }

    const user = await UserModel.findOne({ userId: ctx.from.id });
    if (!user) {
      const userName = ctx.from.username ?? ctx.from.first_name;
      const newUser = new UserModel({
        userName,
        firstName: ctx.from.first_name,
        userId: ctx.from.id,
        isBot: ctx.from.is_bot,
        lang: ctx.from.language_code,
      });
      await newUser.save();
      return newUser;
    }
    return user;
  } catch (error) {
    return error.message;
  }
};

const postmeMongoListener = async (options, type) => {
  try {
    if (type === 'getMediatypes') {
      const getMediatypes = await ChatModel.findOne({ chatID: options.chatId });
      return getMediatypes.postme.mediaTypes;
    }

    if (type === 'setMediatypes') {
      const mediaTypes = await ChatModel.findOne({ chatID: options.chatId });
      if (!mediaTypes) {
        throw new Error("Media types dont't exist!");
      }

      switch (options.msgType) {
        case 'current':
          return mediaTypes.postme.mediaTypes;
        case 'all':
          mediaTypes.postme.mediaTypes.links = false;
          mediaTypes.postme.mediaTypes.video = false;
          mediaTypes.postme.mediaTypes.photo = false;
          mediaTypes.postme.mediaTypes.audio = false;
          mediaTypes.postme.mediaTypes.all = !mediaTypes.postme.mediaTypes.all;
          break;
        case 'photo':
          mediaTypes.postme.mediaTypes.all = false;
          mediaTypes.postme.mediaTypes.photo =
            !mediaTypes.postme.mediaTypes.photo;
          break;
        case 'video':
          mediaTypes.postme.mediaTypes.all = false;
          mediaTypes.postme.mediaTypes.video =
            !mediaTypes.postme.mediaTypes.video;
          break;
        case 'links':
          mediaTypes.postme.mediaTypes.all = false;
          mediaTypes.postme.mediaTypes.links =
            !mediaTypes.postme.mediaTypes.links;
          break;
        case 'audio':
          mediaTypes.postme.mediaTypes.all = false;
          mediaTypes.postme.mediaTypes.audio =
            !mediaTypes.postme.mediaTypes.audio;
          break;
        default:
          break;
      }

      await mediaTypes.save();
      return mediaTypes.postme.mediaTypes;
    }

    if (type === 'getPost') {
      const allMediaTypes = random.shuffle([
        '$links',
        '$photo',
        '$animation',
        '$video',
        '$audio',
        '$voicenote',
        '$videonote',
      ]);
      let randomType;

      const selectedMediaTypesArr = Object.entries(options.mediaTypes.toJSON())
        .filter((t) => !!t[1])
        .map((t) => t[0]);

      const getListenerChat = await ChatModel.findOne({
        chatID: options.chatId,
      });
      if (!getListenerChat) {
        throw new Error('Chat not found');
      }
      if (getListenerChat.postme.listening === 0) {
        return 'Сначала веберите источник. <b>Введите</b> <code>/postme options</code>';
      }

      const listeningChatId = getListenerChat.postme.listening;

      const getPost = async (data) => {
        if (!selectedMediaTypesArr.length) {
          return data;
        }
        const randomCount = random.integer(0, selectedMediaTypesArr.length - 1);

        randomType =
          selectedMediaTypesArr[randomCount] === 'all'
            ? selectedMediaTypesArr[randomCount]
            : selectedMediaTypesArr.splice(randomCount, 1)[0];

        const mediaType =
          randomType === 'all'
            ? [allMediaTypes.pop()]
            : randomType === 'audio'
            ? ['$audio', '$voicenote']
            : randomType === 'photo'
            ? ['$photo']
            : randomType === 'video'
            ? ['$video', '$videonote', '$animation']
            : ['$links'];

        const getData = await ChatModel.aggregate([
          { $match: { chatID: getListenerChat.postme.listening } },
          { $replaceRoot: { newRoot: `$$ROOT.postme.content` } },
          {
            $project: {
              [randomType]: {
                $concatArrays: mediaType,
              },
            },
          },
          { $unwind: `$${randomType}` },
          { $sample: { size: 1 } },
        ]);

        if (
          !getData.length &&
          selectedMediaTypesArr.length &&
          allMediaTypes.length
        ) {
          return getPost(getData);
        }
        return getData;
      };

      const post = await getPost();

      if (!post.length) {
        return undefined;
      }

      const postedMessage = post[0][randomType];
      redisClient.emitter.emit('sendPost', {
        action: 'sendMessage',
        message: postedMessage,
        chatIdTarget: options.chatId,
        chatId: listeningChatId,
      });
      return true;
    }

    if (type === 'listening') {
      const listenerChat = await ChatModel.findOneAndUpdate(
        { chatID: options.listenerChatId },
        { $set: { 'postme.listening': options.listeningChatId } },
      );

      if (listenerChat.postme.listening) {
        await ChatModel.updateOne(
          { chatID: listenerChat.postme.listening },
          { $pull: { 'postme.listeners': listenerChat.chatID } },
        );
      }

      await ChatModel.updateOne(
        { chatID: options.listeningChatId },
        { $push: { 'postme.listeners': options.listenerChatId } },
      );

      return 'Ресурс успешно выбран!';
    }

    if (type === 'protected') {
      try {
        const listenerChat = await ChatModel.findOne(
          { chatID: options.listeningChatId },
          { 'postme.passwordRequired': 1 },
        );
        const isProtected = listenerChat
          ? { isProtected: listenerChat.postme.passwordRequired }
          : false;
        return isProtected;
      } catch (error) {
        console.error(error);
      }
    }

    if (type === 'getHash') {
      const listenerChat = await ChatModel.findOne(
        { chatID: options.listeningChatId },
        { 'postme.password': 1 },
      );
      const password = listenerChat
        ? { password: listenerChat.postme.password }
        : false;
      return password;
    }

    if (type === 'selectSource') {
      const { page, limit } = options;
      const getActiveResources = await ChatModel.find(
        { 'postme.resourceActive': true },
        {
          chatType: 1,
          title: 1,
          username: 1,
          chatID: 1,
          'postme.passwordRequired': 1,
        },
      )
        .sort({ 'postme.dateActive': -1 })
        .skip(page * limit)
        .limit(limit + 1); // +1 to track the end of data

      if (!getActiveResources.length) {
        return false;
      }

      return getActiveResources;
    }

    if (type === 'adding') {
      const chat = await ChatModel.findOne({ chatID: options.chatId });
      if (!chat) {
        throw new Error(`Сhat [id: ${options.chatId}] not found`);
      }

      if (options.problem) {
        chat.postme.resourceActive = false;
        chat.markModified('postme');
        await chat.save();
        const message =
          options.problem === 'chatType'
            ? `Для добавления ресурса в базу, добавьте к себе пользователя ${process.env.NAME_SHEN_VISOR}`
            : options.problem === 'private'
            ? `В личных сообщения функция Postme неработает, только каналы или группы`
            : 'Заглушка';
        return message;
      }

      if (chat.postme.resourceActive === true) {
        return 'Чат уже в базе данных';
      }

      chat.postme.resourceActive = true;
      chat.postme.passwordRequired = false;
      chat.postme.dateActive = new Date();

      if (options.setPassword) {
        chat.postme.passwordRequired = true;
        chat.postme.password = await hashPassword(options.password);
      }

      await chat.save();

      redisClient.emitter.emit('adding', {
        action: 'scrapChat',
        chatId: chat.chatID,
        userbotExist: options.userbotExist,
      });

      return 'Чат добавлен в базу данных';
    }

    if (type === 'delete') {
      await ChatModel.updateMany(
        { 'postme.listening': options.chatId },
        { $set: { 'postme.listening': 0 } },
        { multi: true },
      );

      await ChatModel.updateOne(
        { chatID: options.chatId },
        [
          {
            $set: {
              'postme.listeners': [],
              'postme.resourceActive': false,
              'postme.passwordRequired': false,
              'postme.password': '',
            },
          },
          {
            $unset: ['postme.content'],
          },
        ],
        { multi: true },
      );
      return true;
    }
  } catch (error) {
    console.error(error);
  }
};

const addChatMongoListener = async (ctx) => {
  try {
    const incomingChat = await ctx.getChat();
    const isPrivateChat = !!incomingChat.username;
    const chat = await ChatModel.findOne({ chatID: incomingChat.id });

    const getChat = ctx ? await ctx.getChat() : false;
    const private = !getChat ? chat.private : getChat.username ? false : true;

    if (!chat) {
      const newChat = new ChatModel({
        chatID: chat.id,
        description: chat.description || 'Без описания',
        photoLogo: chat.photo,
        title: chat.title,
        chatType: chat.type,
        username: chat.username || 'Без имени',
        maxMsgId: returnMsgId(ctx),
        private,
        listening: [],
      });

      await newChat.save();
      return `${chat.type} ${
        chat.title ?? chat.username
      } успешно добавлен в базу`;
    }

    if (res) {
      res.description = chat.description || 'Без описания';
      res.photoLogo = chat.photo;
      res.title = chat.title;
      res.chatType = chat.type;
      res.username = chat.username;
      res.private = private;

      if (returnMsgId(ctx)) {
        res.maxMsgId = returnMsgId(ctx);
      }
      res.save((err, futureMessage) => {
        if (err) console.error(err);
        resolve(`${chat.type} ${chat.title || chat.username} успешно обновлен`);
      });
    }
  } catch (error) {}
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
      : await ChatModel.findOne({ chatID: options.chatId });

    if (!getChat && !options.userBotData) {
      redisClient.emitter.emit('getChatInfo', {
        ...options,
        action: 'getChatInfo',
      });
      return;
    }

    const chat =
      typeof getChat === 'string'
        ? await ChatModel.findOne({ chatID: options.chatId })
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
        chatId: chat.chatID,
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
  postmeMongoListener,
  addChatMongoListener,
  adminMongoListener,
};
