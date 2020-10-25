const Markup = require('telegraf/markup')
const { RespectModel } = require('../DB/mongo/models/schemas')

module.exports = async (ctx) => {
  ctx.telegram.sendMessage(ctx.chat.id, ctx.match[1], Markup.inlineKeyboard([
      Markup.callbackButton(`👍 0`, 'like'),
      Markup.callbackButton(`👎 0`, 'dislike')
  ]).extra())
    .then(ctx_then =>{
      let rate = new RespectModel({
          chatId: ctx_then.chat.id,
          userId: ctx_then.from.id,
          messageId: ctx_then.message_id,
          text: ctx_then.text,
          like: 0,
          dislike: 0
      })
      rate.save((err)=>{
          if (err) {
            console.error(err)
          }
      })
    })
}
