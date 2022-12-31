const RedisEmitter = require('node-redis-pubsub')

const redisEmitter = new RedisEmitter({
  port: 6379,
  scope: 'demo'  
})

module.exports = redisEmitter
