import redisClient from '../DB/redis';
import { adminMongoListener } from '../DB//mongo/mongoListener';

const { emitter } = redisClient;
emitter.on('getChatInfoResponse', (options) => {
  adminMongoListener(options, 'addingChat');
});

export default {}
