import { hashPassword, checkHashPassword } from '../../utils/passwordHash';
import { ChatModel } from './models/chatModel';
import { PostmeModel } from './models/postmeModel';
import { redisEmitter } from '../redis';
import { getUserPermissions } from './user';
import { contentType, ContentType } from '../../contracts';
import { PostmeContent } from '../../handlers/postme/postme.types';
import { randomFromArray } from './utils';
import { ContentModel } from './models';

export const getMediatypes = () => undefined;
export const setMediatypes = () => undefined;

export const setProtected = () => undefined;
export const getPasswordHash = () => undefined;

export const addChatAsResource = async (chatId: number, password?: string) => {
  try {
    const chat = await ChatModel.findOne({ chatId });
    let isNewResource = false;

    if (!chat) {
      throw new Error(`Сhat [id: ${chatId}] not found`);
    }

    let postme = await PostmeModel.findOne({ chat: chat._id });

    if (!postme) {
      postme = new PostmeModel({
        chat: chat._id,
      });
      isNewResource = true;
    }

    if (password) {
      postme.password = await hashPassword(password);
    }

    if (postme.status === 1) {
      const protectedMessage = password
        ? 'Обновлен пароль доступа к ресурсу'
        : '';
      throw new Error(
        `Чат уже в базе, и является активным. ${protectedMessage}`,
      );
    }

    postme.status = 1;
    postme.protected = !!password;
    postme.createdDate = new Date();

    await postme.save();

    if (!isNewResource) return;

    redisEmitter.emit(
      'adding',
      JSON.stringify({
        chatId: chat.chatId,
      }),
    );
  } catch (error) {
    console.log(error);
    return (error as Error).message;
  }
};

export const comparePassword = async (
  password: string,
  chatId: number,
): Promise<boolean> => {
  try {
    const chat = await ChatModel.findOne({ chatId });

    if (!chat) throw new Error(`Чат "${chatId}" не найден`);

    const postme = await PostmeModel.findOne({ chat });

    if (!postme)
      throw new Error(`Чат "${chatId}" не явлеятся доступным ресурсом`);

    return await checkHashPassword(password, postme.password);
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const getAvailableChats = async (pageIndex: number) => {
  try {
    const resources = await PostmeModel.find({ status: 1 })
      .skip(pageIndex * 5)
      .limit(5)
      .populate('chat');
    return resources;
  } catch (error) {
    console.log(error);

    return [];
  }
};

export const deleteSource = async (chatId: number): Promise<boolean> => {
  try {
    const resourceChat = await ChatModel.findOne({ chatId });
    const postme = await PostmeModel.findOne({ chat: resourceChat });

    if (!postme) return false;

    await ChatModel.updateMany(
      { selectedPostme: postme._id },
      { selectedPostme: undefined },
    );

    await PostmeModel.updateOne(
      { _id: postme._id },
      { $set: { status: 0, subscribers: [] } },
    );

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const setResourceToListening = async (
  userChatId: number,
  selectedChatId: string | number,
): Promise<boolean> => {
  try {
    const selectedChat = await ChatModel.findOne({ chatId: selectedChatId });
    const postme = await PostmeModel.findOne({ chat: selectedChat });

    if (!postme) throw 'Чат выбранный для подписки не найден';

    const userChat = await ChatModel.findOne({ chatId: userChatId });

    if (!userChat) throw 'Чат пользователя не найден';

    userChat.selectedPostme = postme._id;

    const updatePostme = PostmeModel.updateOne(
      { _id: postme._id },
      { $addToSet: { subscribers: userChat._id } },
    );

    await Promise.all([userChat.save(), updatePostme]);

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

interface GetContentProps {
  chatId: number;
  userId: number;
}

export const getContent = async (props: GetContentProps) => {
  const { chatId, userId } = props;
  try {
    let selectedContentType: ContentType = 'photo';

    const chat = await ChatModel.findOne(
      { chatId },
      { selectedPostme: 1 },
    ).populate('selectedPostme');

    if (!chat) throw new Error('Чат не найден!');
    if (!chat.selectedPostme)
      throw new Error('Сначала выберите доступный ресурс!');

    const permissions = (await getUserPermissions(userId))
      .map((p) => p.split('.'))
      .filter(([pType]) => pType === 'postme')
      .map((p) => p[1] as PostmeContent);

    if (permissions.includes('full')) {
      selectedContentType =
        contentType[Math.floor(Math.random() * contentType.length)];
    } else {
      const postmeType =
        permissions[Math.floor(Math.random() * permissions.length)];
      switch (postmeType) {
        case 'audio':
          selectedContentType = randomFromArray(['audio', 'voicenote']);
          break;
        case 'links':
          selectedContentType = 'links';
          break;
        case 'photo':
          selectedContentType = randomFromArray(['photo', 'animation']);
          break;
        case 'video':
          selectedContentType = randomFromArray(['video', 'videonote']);
          break;
        default:
          break;
      }
    }

    const randomContentId = randomFromArray(
      chat.selectedPostme.content[selectedContentType],
    );

    const content = await ContentModel.findById(randomContentId);

    if (!content) throw new Error('Контент не найден!');

    redisEmitter.emit(
      'postme:getpost',
      JSON.stringify({
        targetChatId: chatId,
        contentId: content.id,
        contentType: content.type,
      }),
    );
  } catch (error) {
    console.log(error);
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
