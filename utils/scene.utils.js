const timerExit = function() {
  let timerId
  const start = (ctx, exitMessage) => {
    timerId = setTimeout( () => {
      ctx.scene.leave()
      console.log('Выхожу из сцены')
      ctx.reply(exitMessage, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Выход', callback_data: 'exitScene', hide: false}]
          ]
        }
      })
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
