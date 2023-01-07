import { hashPassword } from '../../utils/passwordHash';
import { ChatModel } from './models/chatModel';
import { PostmeModel } from './models/postmeModel';
import { redisEmitter } from '../redis';

export const getMediatypes = () => undefined;
export const setMediatypes = () => undefined;
export const getContent = () => undefined;
export const setResourceToListening = () => undefined;
export const setProtected = () => undefined;
export const getPasswordHash = () => undefined;

export const addChatAsResource = async (chatId: number, password?: string) => {
  try {
    const chat = await ChatModel.findOne({ chatId });

    if (!chat) {
      throw new Error(`Сhat [id: ${chatId}] not found`);
    }

    let postme = await PostmeModel.findById({ chat: chat._id });

    if (!postme) {
      postme = new PostmeModel({
        chat: chat._id,
      });
    }

    if (password) {
      postme.password = await hashPassword(password);
    }

    postme.status = 1;
    postme.protected = !!password;
    postme.createdDate = new Date();

    await postme.save();

    redisEmitter.emit(
      'adding',
      JSON.stringify({
        action: 'scrapChat',
        chatId: chat.chatId,
      }),
    );
  } catch (error) {
    console.log(error);
    return (error as Error).message;
  }
};

// const postmeMongoListener = async (options, listenerType) => {
//   try {
//     if (type === 'getMediatypes') {
//       const getMediatypes = await ChatModel.findOne({ chatId: options.chatId });
//       return getMediatypes.postme.mediaTypes;
//     }

//     if (type === 'setMediatypes') {
//       const mediaTypes = await ChatModel.findOne({ chatId: options.chatId });
//       if (!mediaTypes) {
//         throw new Error("Media types dont't exist!");
//       }

//       switch (options.msgType) {
//         case 'current':
//           return mediaTypes.postme.mediaTypes;
//         case 'all':
//           mediaTypes.postme.mediaTypes.links = false;
//           mediaTypes.postme.mediaTypes.video = false;
//           mediaTypes.postme.mediaTypes.photo = false;
//           mediaTypes.postme.mediaTypes.audio = false;
//           mediaTypes.postme.mediaTypes.all = !mediaTypes.postme.mediaTypes.all;
//           break;
//         case 'photo':
//           mediaTypes.postme.mediaTypes.all = false;
//           mediaTypes.postme.mediaTypes.photo =
//             !mediaTypes.postme.mediaTypes.photo;
//           break;
//         case 'video':
//           mediaTypes.postme.mediaTypes.all = false;
//           mediaTypes.postme.mediaTypes.video =
//             !mediaTypes.postme.mediaTypes.video;
//           break;
//         case 'links':
//           mediaTypes.postme.mediaTypes.all = false;
//           mediaTypes.postme.mediaTypes.links =
//             !mediaTypes.postme.mediaTypes.links;
//           break;
//         case 'audio':
//           mediaTypes.postme.mediaTypes.all = false;
//           mediaTypes.postme.mediaTypes.audio =
//             !mediaTypes.postme.mediaTypes.audio;
//           break;
//         default:
//           break;
//       }

//       await mediaTypes.save();
//       return mediaTypes.postme.mediaTypes;
//     }

//     if (type === 'getContent') {
//       const allMediaTypes = random.shuffle([
//         '$links',
//         '$photo',
//         '$animation',
//         '$video',
//         '$audio',
//         '$voicenote',
//         '$videonote',
//       ]);
//       let randomType;

//       const selectedMediaTypesArr = Object.entries(options.mediaTypes.toJSON())
//         .filter((t) => !!t[1])
//         .map((t) => t[0]);

//       const getListenerChat = await ChatModel.findOne({
//         chatId: options.chatId,
//       });
//       if (!getListenerChat) {
//         throw new Error('Chat not found');
//       }
//       if (getListenerChat.postme.listening === 0) {
//         return 'Сначала веберите источник. <b>Введите</b> <code>/postme options</code>';
//       }

//       const listeningChatId = getListenerChat.postme.listening;

//       const getPost = async (data) => {
//         if (!selectedMediaTypesArr.length) {
//           return data;
//         }
//         const randomCount = random.integer(0, selectedMediaTypesArr.length - 1);

//         randomType =
//           selectedMediaTypesArr[randomCount] === 'all'
//             ? selectedMediaTypesArr[randomCount]
//             : selectedMediaTypesArr.splice(randomCount, 1)[0];

//         const mediaType =
//           randomType === 'all'
//             ? [allMediaTypes.pop()]
//             : randomType === 'audio'
//             ? ['$audio', '$voicenote']
//             : randomType === 'photo'
//             ? ['$photo']
//             : randomType === 'video'
//             ? ['$video', '$videonote', '$animation']
//             : ['$links'];

//         const getData = await ChatModel.aggregate([
//           { $match: { chatId: getListenerChat.postme.listening } },
//           { $replaceRoot: { newRoot: `$$ROOT.postme.content` } },
//           {
//             $project: {
//               [randomType]: {
//                 $concatArrays: mediaType,
//               },
//             },
//           },
//           { $unwind: `$${randomType}` },
//           { $sample: { size: 1 } },
//         ]);

//         if (
//           !getData.length &&
//           selectedMediaTypesArr.length &&
//           allMediaTypes.length
//         ) {
//           return getPost(getData);
//         }
//         return getData;
//       };

//       const post = await getPost();

//       if (!post.length) {
//         return undefined;
//       }

//       const postedMessage = post[0][randomType];
//       redisClient.emitter.emit('sendPost', {
//         action: 'sendMessage',
//         message: postedMessage,
//         chatIdTarget: options.chatId,
//         chatId: listeningChatId,
//       });
//       return true;
//     }

//     if (type === 'setResourceToListening') {
//       const listenerChat = await ChatModel.findOneAndUpdate(
//         { chatId: options.listenerChatId },
//         { $set: { 'postme.listening': options.listeningChatId } },
//       );

//       if (listenerChat.postme.listening) {
//         await ChatModel.updateOne(
//           { chatId: listenerChat.postme.listening },
//           { $pull: { 'postme.listeners': listenerChat.chatId } },
//         );
//       }

//       await ChatModel.updateOne(
//         { chatId: options.listeningChatId },
//         { $push: { 'postme.listeners': options.listenerChatId } },
//       );

//       return 'Ресурс успешно выбран!';
//     }

//     if (type === 'setProtected') {
//       try {
//         const listenerChat = await ChatModel.findOne(
//           { chatId: options.listeningChatId },
//           { 'postme.passwordRequired': 1 },
//         );
//         const isProtected = listenerChat
//           ? { isProtected: listenerChat.postme.passwordRequired }
//           : false;
//         return isProtected;
//       } catch (error) {
//         console.error(error);
//       }
//     }

//     if (type === 'getPasswordHash') {
//       const listenerChat = await ChatModel.findOne(
//         { chatId: options.listeningChatId },
//         { 'postme.password': 1 },
//       );
//       const password = listenerChat
//         ? { password: listenerChat.postme.password }
//         : false;
//       return password;
//     }

//     if (type === 'selectSource') {
//       const { page, limit } = options;
//       const getActiveResources = await ChatModel.find(
//         { 'postme.resourceActive': true },
//         {
//           chatType: 1,
//           title: 1,
//           username: 1,
//           chatId: 1,
//           'postme.passwordRequired': 1,
//         },
//       )
//         .sort({ 'postme.dateActive': -1 })
//         .skip(page * limit)
//         .limit(limit + 1); // +1 to track the end of data

//       if (!getActiveResources.length) {
//         return false;
//       }

//       return getActiveResources;
//     }

//     if (type === 'adding') {
//       const chat = await ChatModel.findOne({ chatId: options.chatId });
//       if (!chat) {
//         throw new Error(`Сhat [id: ${options.chatId}] not found`);
//       }

//       if (options.problem) {
//         chat.postme.resourceActive = false;
//         chat.markModified('postme');
//         await chat.save();
//         const message =
//           options.problem === 'chatType'
//             ? `Для добавления ресурса в базу, добавьте к себе пользователя ${process.env.NAME_SHEN_VISOR}`
//             : options.problem === 'private'
//             ? `В личных сообщения функция Postme неработает, только каналы или группы`
//             : 'Заглушка';
//         return message;
//       }

//       if (chat.postme.resourceActive === true) {
//         return 'Чат уже в базе данных';
//       }

//       chat.postme.resourceActive = true;
//       chat.postme.passwordRequired = false;
//       chat.postme.dateActive = new Date();

//       if (options.setPassword) {
//         chat.postme.passwordRequired = true;
//         chat.postme.password = await hashPassword(options.password);
//       }

//       await chat.save();

//       redisClient.emitter.emit('adding', {
//         action: 'scrapChat',
//         chatId: chat.chatId,
//         userbotExist: options.userbotExist,
//       });

//       return 'Чат добавлен в базу данных';
//     }

//     if (type === 'delete') {
//       await ChatModel.updateMany(
//         { 'postme.listening': options.chatId },
//         { $set: { 'postme.listening': 0 } },
//         { multi: true },
//       );

//       await ChatModel.updateOne(
//         { chatId: options.chatId },
//         [
//           {
//             $set: {
//               'postme.listeners': [],
//               'postme.resourceActive': false,
//               'postme.passwordRequired': false,
//               'postme.password': '',
//             },
//           },
//           {
//             $unset: ['postme.content'],
//           },
//         ],
//         { multi: true },
//       );
//       return true;
//     }
//   } catch (error) {
//     console.error(error);
//   }
// };
