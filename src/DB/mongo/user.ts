import { Context } from 'telegraf';
import { ChatModel, UserModel } from './models';
import { UserPermissions } from '../../contracts';

export const addChat = async (ctx: Context) => {
  try {
    const incomingChat = await ctx.getChat();
    const isPrivateChat = incomingChat.type === 'private';
    const chat = await ChatModel.findOne({ chatId: incomingChat.id });

    const description =
      'description' in incomingChat ? incomingChat.description : undefined;
    const title = 'title' in incomingChat ? incomingChat.title : undefined;
    const username =
      'username' in incomingChat ? incomingChat.username : undefined;

    if (!chat) {
      const newChat = new ChatModel({
        chatId: incomingChat.id,
        description,
        photoLogo: incomingChat.photo,
        title,
        chatType: incomingChat.type,
        username,
        maxMsgId: returnMsgId(ctx),
        private: isPrivateChat,
        listening: [],
      });

      await newChat.save();
      return `${newChat.chatType} ${
        newChat.title ?? newChat.username
      } успешно добавлен в базу`;
    }

    chat.photoLogo = {
      big: incomingChat?.photo?.big_file_unique_id,
      small: incomingChat?.photo?.small_file_unique_id,
    };
    chat.chatType = incomingChat.type;
    chat.description = description;
    chat.title = title;
    chat.username = username;
    chat.private = isPrivateChat;

    const maxMsgId = returnMsgId(ctx);

    if (maxMsgId) {
      chat.maxMsgId = maxMsgId;
    }

    await chat.save();

    return `${chat.chatType} ${chat.title ?? chat.username} успешно обновлен`;
  } catch (error) {
    console.log(error);
    return 'Что-то пошло не так';
  }
};

export const getUser = async (ctx: Context) => {
  try {
    if (!ctx.from) {
      throw 'Некорректный пользователь';
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
      return newUser.toObject();
    }
    return user.toObject();
  } catch (error) {
    console.log(error);
  }
};

export const getUserPermissions = async (userId: number) => {
  try {
    const user = await UserModel.findOne({ userId }, { permissions: 1 });

    if (!user) throw 'User not found';

    return user.permissions;
  } catch (error) {
    console.log(error);
    return [];
  }
};
export const toggleUserPermission = async (
  userId: number,
  permission: UserPermissions,
) => {
  try {
    const user = await UserModel.findOne({ userId }, { permissions: 1 });

    if (!user) throw 'User not found';

    if (user.permissions.includes(permission)) {
      user.permissions = user.permissions.filter((p) => p !== permission);
    } else {
      user.permissions.push(permission);
    }

    const savedUser = await user.save();

    return savedUser.permissions;
  } catch (error) {
    console.log(error);
    return [];
  }
};

function returnMsgId(ctx: Context) {
  if (!ctx) {
    return 0;
  }
  const msgChannel = ctx.message ? ctx.message.message_id : 0;
  const msgGroup = ctx.channelPost ? ctx.channelPost.message_id : 0;
  return msgGroup || msgChannel;
}
