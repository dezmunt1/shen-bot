const {userMongoListener} = require('./mongoDB/mongoListener')

module.exports = (ctx) => {
  const inputedTmz = ctx.channelPost
      ? (ctx.channelPost.text.slice(5))
      : ctx.match[1]

  const checkRegex = inputedTmz.match(/^(\+|\-)([0-9]|([0-9][0-2])|12)$/g)

  const message = checkRegex === null
      ? `Ввод <b>${inputedTmz}</b> не корректен`
      : `Часовой пояс изменен на <b>"${inputedTmz}"</b>`
  
  if (Array.isArray(checkRegex)) {
    userMongoListener(ctx)
      .then( thisUser => {
        thisUser.gmt = +inputedTmz
        thisUser.save((err, savedUser)=>{
          if (err) {
            console.error(err)
          }
          ctx.reply(message, {parse_mode: 'HTML'})
        })
      })
  } else {
    ctx.reply(message, {parse_mode: 'HTML'})
  }
}
