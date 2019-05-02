const Telegraf = require('telegraf');
const mongoose = require('mongoose');
const session = require('telegraf/session');
const callbackQuerys = require('./actions');
const {dlMongoListener} = require('./handlers/delorian/mongoListener');
const rateLimit = require('telegraf-ratelimit');
const Stage = require('telegraf/stage');

require('dotenv').config();
const {etiquette, weatherApp, xakepNews, delorian, respect} = require('./handlers');

mongoose.connect(`${process.env.MONGODB_URI}/delorian`, {useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:')); 
db.once('open', console.log.bind(console, 'Соединение установлено')); 
const bot = new Telegraf(process.env.TELETOKEN_DEV);
const stage = new Stage();

const limitConfig = {
  window: 1000,
  limit: 1,
  onLimitExceeded: (ctx) => ctx.answerCbQuery('Не надо так часто жать на кнопочку')
};
bot.use(rateLimit(limitConfig));
bot.use(session());
bot.use(stage.middleware());


bot.use((ctx, next) => {
  const start = new Date();  
  return next(ctx).then(() => {``
    const ms = new Date() - start;
    console.log('Response time %sms', ms);

  });
});

bot.on('left_chat_member', etiquette);
bot.on('new_chat_members', etiquette);

bot.hears(/(с|С)татья хакер/, xakepNews);
bot.hears(/(п|П)огода [а-яА-Яa-zA-Z-]+/, weatherApp );

bot.command('delorian', ctx => {
  delorian.replys(ctx)
    .then(ctx => {
      stage.register(delorian.sendFutureScene, delorian.enteringText);
    })
});

bot.hears(/\/respect (.+)/, (ctx) => {
  respect(ctx, bot);
});

dlMongoListener(bot);

bot.on('callback_query', callbackQuerys);


bot.catch((err) => {console.log('Ooops', err)});

bot.launch();

