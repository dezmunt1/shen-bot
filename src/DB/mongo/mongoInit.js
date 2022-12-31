const mongoose = require('mongoose')
const { AdminModel } = require('./models/schemas')

let i = 1

const connect = async (context) => {
  try {
    Object.assign(this, context)
    await mongoose.connect( this.path, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }, async (error) => {
      if (!error) {
        console.log(`[Server]: БД MongoDB успешно подключена`)
        const admin = await AdminModel.findOne()
        if ( admin ) {
          return
        }
        new AdminModel().save()
        console.log(`[Server]: Создана стандартная учётная запись админа, смените пароль`)
      } else {
        console.log(`[Server]: ${error}`)
      }
    })
    const db = mongoose.connection
    db.on('error', console.error.bind(console, 'connection error:'))
    db.once('open', console.log.bind(console, `Соединение c БД "${db.name}" установлено`))
    this.instanse = i++
  } catch (error) {
    console.log(error.message)
  }
}

class Connect {
  constructor(options={}) {
    this.path = options.path
    this.instanse = i
    connect(this)
  }
}

module.exports = Connect
