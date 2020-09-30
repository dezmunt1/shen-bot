const Scene = require('telegraf/scenes/base')
const { timerExit }= require('../../utils/scene.utils')
const Markup = require('telegraf/markup')
const { postmeMongoListener } = require('../../utils/mongoDB/mongoListener')

/* 
*   Registration Scene
*/

// Enter password

const setPassword = new Scene('setPassword')

setPassword.enter( ctx => {
  const message = await ctx.reply( 'Вы хотите установить пароль на свой источник?',
    Markup.inlineKeyboard([
      Markup.callbackButton('Не устанавливать', 'postmeSetPassword:false'),
      Markup.callbackButton('Установить', 'postmeSetPassword:true'),
    ])
    .extra())
    
    ctx.scene.state = {
      ...ctx.scene.state,
      messageId: message.message_id
    }
})

const chatRegister = new Scene('chatRegister')

chatRegister.enter( async (ctx) => {
  timerExit.start(ctx, 'Время регистрации истекло, попробуйте еще раз!')
  const message = await ctx.reply( 'Введите пароль для доступа к Вашему чату',
    Markup.inlineKeyboard([
      Markup.callbackButton('Выйти', 'exitScene')
    ])
    .extra())
  
  ctx.scene.state = {
    ...ctx.scene.state,
    messageId: message.message_id
  }
})

chatRegister.on('text', async (ctx) => {
  ctx.deleteMessage(ctx.message.message_id)
  const isCorrectInput = ctx.message.text.length >= 6
  const { chatId, messageId, isAuth } = ctx.scene.state

  if ( !isCorrectInput ) {
    return ctx.telegram.editMessageText( chatId, messageId, null, 'Пароль должен быть больше 6 символов',
      Markup.inlineKeyboard([
        Markup.callbackButton('Выйти', 'exitScene')
      ])
      .extra()
    )
  }
  ctx.scene.state = {
    ...ctx.scene.state,
    password: ctx.message.text
  }

  return isAuth ? ctx.message.text : ctx.scene.enter('confirmPassword', ctx.scene.state)
})

// Confirm password Scene
const confirmPassword = new Scene('confirmPassword')

confirmPassword.enter( async(ctx) => {
  const { chatId, messageId } = ctx.scene.state
  const message = await ctx.telegram.editMessageText( chatId, messageId, null, 'Повторите пароль',
    Markup.inlineKeyboard([
      Markup.callbackButton('Выйти', 'exitScene')
    ])
    .extra())
})

confirmPassword.on('text', async (ctx) => {
  ctx.deleteMessage(ctx.message.message_id)
  const { password, chatId, messageId } = ctx.scene.state
  const confirmPassword = ctx.message.text

  if ( password !== confirmPassword) {
    return ctx.telegram.editMessageText( chatId, messageId, null, 'Пароли не совпадают',
      Markup.inlineKeyboard([
        Markup.callbackButton('Выйти', 'exitScene')
      ])
      .extra()
    )
  }

  const message = await postmeMongoListener( ctx.scene.state, 'adding' )
  ctx.telegram.editMessageText( chatId, messageId, null, message,
      Markup.inlineKeyboard([
        Markup.callbackButton('Выйти', 'exitScene')
      ])
      .extra()
    )
  return ctx.scene.leave()
})

/* 
*   Authentication Scene
*/



module.exports = {
  postmeScenes: [ chatRegister, confirmPassword ]
}
