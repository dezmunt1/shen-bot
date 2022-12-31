import {
  articleMongoListener,
  updateArticleResources,
} from '../DB/mongo/mongoListener';
import articleParser from '../utils/articleParser';
import type { ContextWithMatch } from '@app/types';

interface ArticleEntity {
  resource: string;
  data: any;
  funcName: string;
  date: Date;
}

function random<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * (arr.length - 0)) + 0];
}

// Refresh article resources
setInterval(() => {
  updateArticleResources();
}, 1000 * 60 * 60 * random([1, 2, 3]));

export const article = async (ctx: ContextWithMatch) => {
  try {
    const articleResource = ctx.match[ctx.match.length - 1].toLowerCase();

    if (articleResource === 'хакер') {
      const articlesArr = await articleMongoListener(
        articleResource,
        articleParser.xakepParser,
      );
      await ctx.reply(random(articlesArr).link);
      return;
    }

    if (articleResource === 'код дурова' || articleResource === 'код') {
      const articlesArr = await articleMongoListener(
        articleResource,
        articleParser.kodParser,
      );
      return ctx.reply(random(articlesArr));
    }

    if (articleResource === 'comss' || articleResource === 'комсс') {
      const articlesArr = await articleMongoListener(
        articleResource,
        articleParser.comssParser,
      );
      return ctx.reply(random(articlesArr).link);
    }

    if (articleResource === 'list' || articleResource === 'список') {
      return ctx.reply(
        `<b>Список доступных ресурсов:</b>\n1. "код" или "код дурова".\n2. "хакер".\n3. "комсс" или "comss".`,
        Extra.HTML(true),
      );
    }
    ctx.reply(
      `Нет статей по запросу <b>"${articleResource}"</b>`,
      Extra.HTML(true),
    );
  } catch (error) {
    console.error((error as Error).message);
  }
};

export default article;

// TODO
// - Cycle of displaying articles, iterating over the array in a circle
