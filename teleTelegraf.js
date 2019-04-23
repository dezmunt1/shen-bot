const Telegraf = require('telegraf');
const mongoose = require('mongoose');
const session = require('telegraf/session');

require('dotenv').config();
const {etiquette, weatherApp, xakepNews, delorian} = require('./handlers');


mongoose.connect('mongodb://localhost:27017/delorian', {useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:')); 
db.once('open', console.log.bind(console, 'Соединение установлено')); 

const bot = new Telegraf(process.env.TELETOKEN_DEV);

bot.use(session());

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

bot.command('delorian', (ctx)=> {
  delorian(ctx, bot);
});

bot.catch((err) => {console.log('Ooops', err)});

bot.launch();


