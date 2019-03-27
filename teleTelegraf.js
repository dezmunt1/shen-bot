const Telegraf = require('telegraf');
require('dotenv').config();
const etiquette = require('./handlers/etiquette');
const weatherApp = require('./handlers/weatherApp');
const xakepNews = require('./handlers/xakepNews');
const MongoClient = require('mongodb').MongoClient;

const mongoClient = new MongoClient('mongodb://localhost:27017/', {useNewUrlParser: true});
mongoClient.connect((err, client) => {
  if (err) console.error(err);
  const db = client.db('bottelegram');
  const collection = db.collection('users');
  console.log(collection.find());
});
const bot = new Telegraf(process.env.TELETOKEN_DEV);

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
bot.hears(/(п|П)огода [а-яА-Яa-zA-Z-]+/, weatherApp );

bot.launch();