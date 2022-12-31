require('dotenv').config();
require('./DB/redis/redisEmitter');
require('./App');

declare module 'telegraf-ratelimit';
declare module 'bcryptjs';
