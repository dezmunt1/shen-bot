const timerExit = function() {
  let timerId
  const start = (ctx, exitMessage) => {
    timerId = setTimeout( () => {
      ctx.scene.leave()
      console.log('Выхожу из сцены')
      ctx.telegram.editMessageText(ctx.callbackQuery.message.chat.id, ctx.callbackQuery.message.message_id, null, exitMessage)
    }, 1000 * 60 * 3, ctx)
  }
  const stop = () => {
    clearTimeout( timerId )
  }
  return { start, stop }
}()

module.exports = {
  timerExit
}
