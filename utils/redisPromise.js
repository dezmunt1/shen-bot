const { promisify } = require('util')

module.exports = redisClient => {
  return {
    get: promisify(redisClient.get).bind(redisClient),
    set: promisify(redisClient.set).bind(redisClient),
    del: promisify(redisClient.del).bind(redisClient),
  }
}
