import { createClient } from 'redis';
import RedisEmitter from 'node-redis-pubsub';

const redisEmitter = RedisEmitter({
  port: 6379,
  scope: 'demo',
});

const redisClient = createClient()
  .on('connect', () => {
    console.log('Соединение с БД "redis" установлено');
  })
  .on('error', (err) => {
    throw err;
  });

redisClient.connect();

export { redisClient, redisEmitter };
