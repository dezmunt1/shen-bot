import { hashPassword, checkHashPassword } from '../../utils/passwordHash';
import {
  ChatModel,
  PostmeModel,
  contentType,
  ContentType,
  ContentModel,
  UserModel,
} from '@shenlibs/dto';
import { redisEmitter } from '../redis';
import { PostmeContent } from '../../handlers/postme/postme.types';
import { randomFromArray } from './utils';

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
export const getAvailableChatsForParsing = async (pageIndex: number) => {
  try {
    const resources = await ChatModel.find()
      .skip(pageIndex * 5)
      .limit(5);
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

    await UserModel.updateMany(
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
  userId: number,
  selectedChatId: string | number,
): Promise<boolean> => {
  try {
    const selectedChat = await ChatModel.findOne({ chatId: selectedChatId });
    const postme = await PostmeModel.findOne({ chat: selectedChat });

    if (!postme) throw 'Чат выбранный для подписки не найден';

    const user = await UserModel.findOne({ userId });

    if (!user) throw 'Пользователь не найден';

    user.selectedPostme = postme._id;

    const updatePostme = PostmeModel.updateOne(
      { _id: postme._id },
      { $addToSet: { subscribers: user._id } },
    );

    await Promise.all([user.save(), updatePostme]);

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

    const user = await UserModel.findOne(
      { userId },
      { selectedPostme: 1, permissions: 1 },
    ).populate('selectedPostme');

    if (!user) throw new Error('Пользователь не найден!');
    if (!user.selectedPostme)
      throw new Error('Сначала выберите доступный ресурс!');

    const permissions = user.permissions
      .map((p) => p.split('.'))
      .filter(([pType]) => pType === 'postme')
      .map((p) => p[1] as PostmeContent);

    if (permissions.includes('full')) {
      selectedContentType =
        contentType[Math.floor(Math.random() * contentType.length)];
    } else {
      const postmeType =
        permissions[Math.floor(Math.random() * permissions.length)];
      selectedContentType = postmeType === 'full' ? 'photo' : postmeType;
    }

    const randomContentId = randomFromArray(
      user.selectedPostme.content[selectedContentType],
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
    return (error as Error).message;
  }
};
