const Telegraf = require('telegraf');
const rateLimit = require('telegraf-ratelimit');
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const mongoose = require('mongoose');
const actions = require('./actions');
const {dlMongoListener, articleMongoListener, addChatMongoListener, userMongoListener} = require('./utils/mongoListener');
const tmzEditor = require('./utils/tmzEditor');


require('dotenv').config();
const {etiquette, weatherApp, getArticle, delorian, respect, postme} = require('./handlers');

mongoose.connect(`${process.env.MONGODB_URI}/delorian`, {useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:')); 
db.once('open', console.log.bind(console, 'Соединение установлено')); 
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
bot.use(session());
bot.use(stage.middleware());

actions.sendToRegister.forEach(scene => { //регистрируем сцены из actions.js
  stage.register(scene);
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
  });
  console.log(ctx);
  const start = new Date();  
  return next(ctx).then(() => {``
    const ms = new Date() - start;
    console.log('Response time %sms', ms);

  });
});

bot.on('left_chat_member', etiquette);
bot.on('new_chat_members', etiquette);

bot.hears(/(с|С)татья (.+)/, getArticle);
bot.hears(/(п|П)огода [а-яА-Яa-zA-Z-]+/, weatherApp );

bot.command('delorian', ctx => {
  delorian.replys(ctx);
});


bot.hears(/\/postme (.+)/, (ctx) => {
  postme.replys(ctx);

});
bot.command('postme', (ctx) => {
  postme.replys(ctx);
});

bot.hears(/\/respect (.+)/, (ctx) => {
  respect(ctx, bot);
});
bot.hears(/\/tmz\s(.+)/, (ctx) => {
  tmzEditor(ctx);
});

bot.help(ctx => {
  ctx.reply(`
  Многофункциональный бот-помощник <i>Shen</i>🤖.\n
  Если вы используете бота в 🗣группе или 📣канале - не забудьте дать ему права администратора. Это необходимо чтобы бот мог реагировать на ваши команды. Такова политика безопасности <i>Telegram</i>.
  По умолчанию Ваш часовой пояс UTC+3 (г. Москва).  Если вы в другом регионе то воспользуйтесь командой <code>/tmz +\\-число</code>. Корректный часовой пояс важен для работы некоторого функционала бота.\n
  <b>Способности бота:</b>\n
  1. <code>/delorian</code> - отправить сообщение в будущее (напоминалка).\n
  2. <code>/respect</code> <i>текс</i> - лайки и дизлайки к <i>тексту</i>.\n
  3. <code>Статья</code> <i>ресурс</i> - для запроса свежей рандомной статьи (вбей вместо <i>ресурса</i> "список" или "list" – для получения перечня ресурсов).\n
  4. <code>/postme</code> - рандомный репост из доступного списка групп и каналов, можешь добавить свой ресурс как источник, тем самым делясь контентом с другими. Для настройки пиши "/postme options"\n
  По всем вопросам и предложениям к @dezamat .
  `, Telegraf.Extra.HTML(true));
})

dlMongoListener(bot);
articleMongoListener();

bot.on('callback_query', actions.callbackQuerys);


bot.catch((err) => {console.log('Ooops', err)});

bot.launch();

