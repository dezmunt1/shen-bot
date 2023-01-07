import { RespectModel } from './models/schemas';

interface Rate {
  chatId: number;
  userId: number;
  messageId: number;
  text: string;
  like: number;
  dislike: number;
}

export const saveRate = async (newRate: Rate): Promise<void> => {
  try {
    const rate = new RespectModel(newRate);
    await rate.save();
  } catch (error) {
    console.log(error);
  }
};

interface UpdateRate {
  chatId: number;
  messageId: number;
  rate: 'like' | 'dislike';
}

export const updateRate = async (props: UpdateRate) => {
  const { chatId, messageId, rate } = props;

  const dbRate = await RespectModel.findOne({ chatId, messageId });

  if (!dbRate) throw 'Такого сообщения не существует';

  dbRate[rate]++;

  await dbRate.save();

  return dbRate.toObject();
};
