import { Telegraf, Context } from 'telegraf';
import * as rateLimit from 'telegraf-ratelimit';
import { Stage } from 'telegraf/typings/scenes';
import session from '@telegraf/session';
import MongoInit from './DB/mongo/mongoInit';
import callbackQuerys from './actions/callbackQuerys';
import tmzEditor from './utils/tmzEditor';
import errorHandler from './utils/errorHandler';
import {
  etiquette,
  weatherApp,
  getArticle,
  delorian,
  respect,
  postme,
  admin,
} from './handlers';
import { addChatMongoListener, getUser } from './DB/mongo/mongoListener';
import { dlMongoListener } from './DB/mongo/delorian';
import scenes from './handlers/scenes';
import './actions/redisEmmiter';

new MongoInit({
  path: process.env.MONGODB_URI,
});

const bot = new Telegraf(process.env.TELETOKEN_DEV!);
const stage = new Stage();

const limitConfig = {
  window: 1000,
  limit: 1,
  onLimitExceeded: (ctx: Context) => {
    if (ctx.callbackQuery) {
      ctx.answerCbQuery('Не надо так часто жать на кнопочку');
    }
  },
};

bot.use(rateLimit(limitConfig));
bot.use(
  session({
    property: 'session',
    store: new Map(),
    getSessionKey: (ctx) => {
      if (ctx.chat.type === 'channel') {
        return `${ctx.chat.id}`;
      }
      return ctx.from && ctx.chat && `${ctx.from.id}:${ctx.chat.id}`;
    },
    ttl: 1,
  }),
);

// bot.use(stage.middleware());

scenes.forEach((scene) => {
  // регистрируем сцены
  stage.register(scene);
});

bot.on('message', async (ctx, next) => {
  if (ctx.from.id === +process.env.SHEN_VISOR!) {
    postme.replys(ctx, 'receivingСontent');
  }
  return next();
});

bot.use(async (ctx, next) => {
  try {
    const messageChatInfo = await addChatMongoListener(ctx);
    console.log(messageChatInfo);

    const messageUserInfo = await getUser(ctx);

    if (typeof messageUserInfo === 'string') {
      console.log(messageUserInfo);
    }

    const start = Date.now();
    return await next().then(() => {
      console.log(`Response time ${Date.now() - start}ms`);
    });
  } catch (error) {
    console.error(error);
  }
});

bot.on('left_chat_member', etiquette);
bot.on('new_chat_members', etiquette);

bot.hears(/^(с|С)татья (.+)/, getArticle);
bot.hears(/^(п|П)огода [а-яА-Яa-zA-Z-]+/, weatherApp);

bot.command('delorian', async (ctx) => {
  delorian.replys(ctx);
});

bot.hears(/\/postme (.+)/, async (ctx) => {
  postme.replys(ctx);
});
bot.command('postme', async (ctx) => {
  postme.replys(ctx, 'content');
});

bot.hears(/\/respect (.+)/, respect);
bot.hears(/\/tmz\s(.+)/, tmzEditor);
bot.hears(/\/admin\s(\S+)\s(.+)/, admin);
bot.hears(/^@error/, (ctx) => {
  let message = ctx.message.text.split('=')[1];
  message = JSON.parse(message);
  errorHandler(message, ctx);
});

bot.command('help', (ctx) => {
  ctx.reply(
    `
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
  `,
    Telegraf.Extra.HTML(true),
  );
});

bot.command('start', dlMongoListener);
bot.on('callback_query', callbackQuerys);

bot.catch((err) => {
  console.log('Ooops', err);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
