const mongoose = require('mongoose')

let i = 1

const connect = async (context) => {
  try {
    Object.assign(this, context)
    await mongoose.connect( this.path, {
      useNewUrlParser: true,
      user: this.auth.name,
      pass: this.auth.pwd,
      dbName: 'delorian',
      useUnifiedTopology: true,
      useCreateIndex: true
    }, error => {
      if (!error) {
        console.log(`[Server]: БД MongoDB успешно подключена`)
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
    this.auth = options.auth
    this.instanse = i
    connect(this)
  }
}

module.exports = Connect
