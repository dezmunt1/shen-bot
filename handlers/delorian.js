const Markup = require('telegraf/markup')
const { userMongoListener } = require('../DB//mongo/mongoListener')

const replys = async (ctx) => {
  try {
    ctx.deleteMessage(ctx.message.message_id)
    const inviteSended = await ctx.reply('Добро пожаловать в Delorian, чем могу быть полезен?',
      Markup.inlineKeyboard([
        Markup.callbackButton('🚀 Отправить в будущее', 'sendFuture')
      ]).extra())

    const gmt = await userMongoListener(ctx)

    ctx.session.delorian = {
      chatId: inviteSended.chat.id,
      messageId: inviteSended.message_id,
      gmt: gmt.gmt
    }
  } catch (error) {
    console.error(error.message)
  }
}

module.exports = {
  replys
}
