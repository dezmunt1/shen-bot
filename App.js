const Telegraf = require('telegraf');
const rateLimit = require('telegraf-ratelimit');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const redis = require('redis');
const redisPromise = require('./utils/redisPromise');
const RedisEmmiter = require('node-redis-pubsub');
const MongoInit = require('./utils/mongoDB/mongoInit');
const actions = require('./actions');
const {dlMongoListener, addChatMongoListener, userMongoListener} = require('./utils/mongoDB/mongoListener');
const tmzEditor = require('./utils/tmzEditor');
const errorHandler = require('./utils/errorHandler');
const {etiquette, weatherApp, getArticle, delorian, respect, postme} = require('./handlers');

const redisEmmiter = new RedisEmmiter({
  port: 6379,
  scope: 'demo'  
});

const redisClient = redis.createClient()
  .on('connect', () => {
  console.log('Соединение с БД "redis" установлено');
  })
  .on('error', (err) => {
    throw err
  })

require('dotenv').config();


const db = new MongoInit({
  path: process.env.MONGODB_URI,
  auth: {
    name: process.env.MONGODB_USER,
    pwd: process.env.MONGODB_PWD
  }
});

const bot = new Telegraf(process.env.TELETOKEN_DEV, {channelMode: true} );
const stage = new Stage();

const limitConfig = {
  window: 1000,
  limit: 1,
  onLimitExceeded: (ctx) => {
    if (ctx.callbackQuery) {
      ctx.answerCbQuery('Не надо так часто жать на кнопочку');
      return;
    }
  }
};
bot.use(rateLimit(limitConfig));
bot.use(session({
  getSessionKey: (ctx) => {
    if (ctx.chat.type === 'channel') {
      return `${ctx.chat.id}` 
    }
    return ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`;
  }
}));
bot.use(stage.middleware());

bot.context.redis = {...redisPromise( redisClient ), redisEmmiter};

actions.sendToRegister.forEach(scene => { //регистрируем сцены из actions.js
  stage.register(scene);
})

bot.on( 'message', (ctx, next) => {
  if (ctx.from.id === +process.env.SHEN_VISOR) {
    postme.replys(ctx, 'receivingСontent');
  }
  return next(ctx)
})

bot.use((ctx, next) => {
  ctx.getChat(ctx.chat.id)
    .then( thisChat => {
      addChatMongoListener(thisChat, ctx)
        .then( msg => console.log(msg));
    });
  userMongoListener(ctx)
  .then( thisUser => {
    if (typeof(thisUser) === 'string') {
      console.log(thisUser);
    }
  })
  .catch( err => {
    console.log(err)
  });
  const start = new Date();  
  return next(ctx).then(() => {
    const ms = new Date() - start;
    console.log('Response time %sms', ms);

  });
});

bot.on('left_chat_member', etiquette);
bot.on('new_chat_members', etiquette);

bot.hears(/^(с|С)татья (.+)/, getArticle);
bot.hears(/^(п|П)огода [а-яА-Яa-zA-Z-]+/, weatherApp );

bot.command('delorian', ctx => {
  delorian.replys(ctx);
});

bot.hears(/\/postme (.+)/, (ctx) => {
  postme.replys(ctx);

});
bot.command('postme', (ctx) => {
  postme.replys(ctx, 'content');
});

bot.hears(/\/respect (.+)/, (ctx) => {
  respect(ctx, bot);
});
bot.hears(/\/tmz\s(.+)/, (ctx) => {
  tmzEditor(ctx);
});
bot.hears(/^@error/, (ctx) => {
  let message = (ctx.message.text).split('=')[1];
  message = JSON.parse(message);
  errorHandler(message, ctx);
});

bot.command('help', ctx => {
  ctx.Greply(`
  Многофункциональный бот-помощник <i>Shen</i>🤖.\n
  Если вы используете бота в 🗣группе или 📣канале - не забудьте дать ему права администратора. Это необходимо чтобы бот мог реагировать на ваши команды. Такова политика безопасности <i>Telegram</i>.
  По умолчанию Ваш часовой пояс UTC+3 (г. Москва).  Если вы в другом регионе то воспользуйтесь командой <code>/tmz +\\-число</code>. Корректный часовой пояс важен для работы некоторого функционала бота.\n
  <b>Способности бота:</b>\n
  1. <code>/delorian</code> - отправить сообщение в будущее (напоминалка).\n
  2. <code>/respect</code> <i>текс</i> - лайки и дизлайки к <i>тексту</i>.\n
  3. <code>Статья</code> <i>ресурс</i> - для запроса свежей рандомной статьи (вбей вместо <i>ресурса</i> "список" или "list" – для получения перечня ресурсов).\n
  4. <code>/postme</code> - рандомный контент из доступного списка групп и каналов, в меню настроек можешь добавить свою группу\\канал как источник, тем самым делясь контентом с другими. Для настройки пиши "<code>/postme options</code>". Если у вас приватная группа, то добавьте в нее ${process.env.NAME_SHEN_VISOR}, он поможет боту отработать корректно!\n
  По всем вопросам и предложениям к @dezamat .\n
  5. <code>Погода</code> <i>город</i> - узнать погоду в своем городе.
  `, Telegraf.Extra.HTML(true));
})
bot.command('start', ctx => {
  dlMongoListener(ctx);
})



bot.on('callback_query', actions.callbackQuerys);


bot.catch((err) => {
  console.log('Ooops', err);
});

bot.launch();

