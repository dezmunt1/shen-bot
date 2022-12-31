import { Context } from 'telegraf';
import { DelorianModel } from './models/schemas';
import redisClient from '../redis/redisInit';
import toObjectId, { IObjectId } from './utils';

interface Remindes {
  chatId: number;
  userId: number;
  remindTime: Date;
  text: string;
  performed: boolean;
  gmt: number;
}
interface RemindesRedis extends Pick<Remindes, 'userId' | 'remindTime'> {
  dbId: IObjectId;
}

const checkDelorianStore = (ctx: Context) => {
  let timerId: NodeJS.Timeout;
  const start = async () => {
    clearTimeout(timerId);
    try {
      const getRemindes = await redisClient.get('delorian');
      const remindes: RemindesRedis[] = JSON.parse(getRemindes);

      timerId = setTimeout(
        async function check(checkRemindes) {
          const now = new Date();
          const remindNow: IObjectId[] = [];
          const newWatchArray = checkRemindes.filter((remind) => {
            const remindTime = new Date(remind.remindTime); // Из UTC в локальное время
            const dbId = toObjectId(remind.dbId);
            if (remindTime > now) {
              return remind;
            }
            if (!dbId) return;
            remindNow.push(dbId);
            return undefined;
          });

          if (!remindNow.length) {
            clearTimeout(timerId);
            timerId = setTimeout(check, 1000, newWatchArray);
            return;
          }

          const dbRemindes = await DelorianModel.find({
            _id: { $in: remindNow },
          });

          await Promise.all(
            dbRemindes.map(async (remind) => {
              const { chatId, userId, text } = remind;

              if (!chatId || !userId) return Promise.resolve();

              const { user } = await ctx.telegram.getChatMember(chatId, userId);

              await ctx.telegram.sendMessage(
                chatId,
                `[ПРИВЕТ ИЗ ПРОШЛОГО ДЛЯ @${user.username}]: ${text}`,
              );
            }),
          );

          await DelorianModel.updateMany(
            { _id: { $in: remindNow } },
            { $set: { performed: true } },
          );

          refresh();
        },
        1000,
        remindes,
      );
    } catch (error) {
      console.error(error);
    }
  };

  const stop = () => {
    clearTimeout(timerId);
  };

  const refresh = () => {
    clearTimeout(timerId);
    dlMongoListener(ctx);
  };

  return {
    start,
    stop,
    refresh,
  };
};

export const dlMongoListener = async (ctx: Context, newData?: boolean) => {
  const check = checkDelorianStore(ctx);
  try {
    if (newData) {
      return check.refresh();
    }
    await redisClient.set('delorian', JSON.stringify([]));
    const now = new Date();

    const updateStore = await DelorianModel.find({
      remindTime: { $gte: now },
      performed: false,
    });

    if (!updateStore.length) {
      return undefined;
    }

    const remindsStore: RemindesRedis[] = [];
    updateStore.forEach((item) => {
      const { userId, remindTime, id } = item;
      if (!userId || !remindTime) return;
      remindsStore.push({
        userId,
        remindTime,
        dbId: id,
      });
    });

    await redisClient.set('delorian', JSON.stringify(remindsStore));

    check.start();
  } catch (error) {
    console.error(error);
  }
};

export const addDelorianModel = async (data: Remindes) => {
  if (!data) {
    return;
  }
  const newEntry = new DelorianModel(data);
  await newEntry.save();
};
