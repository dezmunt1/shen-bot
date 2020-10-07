module.exports = async (ctx) => {
    
  // New user in chat
  if (ctx.message.new_chat_member) {
    let userInfo = ctx.message.new_chat_member;
    let newUser = userInfo.username ? userInfo.username : userInfo.first_name;
    ctx.reply(`Приветсвую тебя уважаемый (нет) @${newUser}`);
  }

  // Left user
  if (ctx.message.left_chat_member) {
    let userInfo = ctx.message.left_chat_member;
    let newUser = userInfo.username ? userInfo.username : userInfo.first_name;
    ctx.reply(`Пшёл вон @${newUser}`);
  }
};
