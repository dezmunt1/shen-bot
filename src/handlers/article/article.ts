import { getArticle, updateArticles } from '../../DB/mongo/article';
import { xakepParser, comssParser, habrParser } from './article.util';
import type { BotContext } from '../../contracts';

function random<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * (arr.length - 0)) + 0];
}

export const article = async (ctx: BotContext) => {
  try {
    const articleResource = ctx.match[ctx.match.length - 1].toLowerCase();

    if (articleResource === 'хакер') {
      const articles = await getArticle('xakep', xakepParser);

      if (!articles) return;

      await ctx.reply(random(articles));
      return;
    }

    if (articleResource === 'comss' || articleResource === 'комсс') {
      const articles = await getArticle('comss', comssParser);
      if (!articles) return;
      await ctx.reply(random(articles));
      return;
    }

    if (articleResource === 'habr' || articleResource === 'хабр') {
      const articles = await getArticle('habr', habrParser);
      if (!articles) return;
      await ctx.reply(random(articles));
      return;
    }

    if (articleResource === 'list' || articleResource === 'список') {
      await ctx.reply(
        `<b>Список доступных ресурсов:</b>\n1. "habr" или "хабр".\n2. "хакер".\n3. "комсс" или "comss".`,
        { parse_mode: 'HTML' },
      );
      return;
    }
    await ctx.reply(`Нет статей по запросу <b>"${articleResource}"</b>`, {
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error((error as Error).message);
    ctx.reply('Что то пошло не так!');
  }
};

setInterval(() => {
  updateArticles();
}, 1000 * 60 * 60);

export default {};

// TODO
// - Cycle of displaying articles, iterating over the array in a circle
