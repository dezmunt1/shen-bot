import { Context } from 'telegraf';
import { User } from 'telegraf/typings/core/types/typegram';

export const etiquette = async (ctx: Context) => {
  if (ctx.message && 'new_chat_member' in ctx.message) {
    const { username, first_name } = ctx.message.new_chat_member as User;
    ctx.reply(`Приветсвую тебя уважаемый (нет) @${username ?? first_name}`);
  }

  if (ctx.message && 'left_chat_member' in ctx.message) {
    const { username, first_name } = ctx.message.left_chat_member;
    ctx.reply(`Пшёл вон @${username ?? first_name}`);
  }
};

export default etiquette;
