const { correctMessageId } = require('../utils/telegram.utils')
const { adminMongoListener } = require('../DB/mongo/mongoListener')

module.exports = async (ctx) => {
  const [ password, action ] = ctx.match.slice(1)
  const checkPassword = await adminMongoListener({password}, 'checkPassword')
  const actions = [
    'addResource',
    'delResource'
  ]

  if ( !checkPassword ) {
    return
  }
  const actionSuccess = actions.includes( action )

  if ( actionSuccess ) {
    ctx.scene.enter( action )
    return
  }

  const messageId = correctMessageId( ctx )
  ctx.deleteMessage( messageId )
}

// TODO
// Добавить возможность удалять ресурсы админу
//    Приглашение нажать на ресурс который необходимо удалить.
//      - пагинация
//    При нажатии сцена с подтверждением
// Доделать оповещение об добавлении/удалении конкретного ресурса для админа