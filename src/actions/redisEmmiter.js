const redisClient = require('../DB/redis/redisInit');
const { adminMongoListener } = require('../DB//mongo/mongoListener');

const { emitter } = redisClient;
emitter.on('getChatInfoResponse', (options) => {
  adminMongoListener(options, 'addingChat');
});
