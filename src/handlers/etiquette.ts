import { Context } from 'telegraf';

export const etiquette = async (ctx: Context) => {
  // New user in chat
  if (ctx.chatMember?.new_chat_member) {
    const { username, first_name } = ctx.chatMember.new_chat_member.user;
    ctx.reply(`Приветсвую тебя уважаемый (нет) @${username ?? first_name}`);
  }

  // Left user
  if (ctx.chatMember?.old_chat_member) {
    const { username, first_name } = ctx.chatMember.old_chat_member.user;
    ctx.reply(`Пшёл вон @${username ?? first_name}`);
  }
};

export default etiquette;
