const redis = require('redis')
const redisEmitter = require('./redisEmitter')
const { promisify } = require('util')

const redisClient = redis.createClient()
  .on('connect', () => {
    console.log('Соединение с БД "redis" установлено')
  })
  .on('error', (err) => {
    throw err
  })

const promisifyRedis = {
  get: promisify(redisClient.get).bind(redisClient),
  set: promisify(redisClient.set).bind(redisClient),
  del: promisify(redisClient.del).bind(redisClient),
  emitter: redisEmitter
}

module.exports = promisifyRedis