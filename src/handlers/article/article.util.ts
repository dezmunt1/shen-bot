import axios from 'axios';
import RssParser from 'rss-parser';

const NOT_FOUND = ['Статья не найдена'];

export const comssParser = async (): Promise<string[]> => {
  const rssParser = new RssParser();
  try {
    const parseResult = await rssParser.parseURL(
      'https://zapier.com/engine/rss/646640/newscomss/',
    );

    return parseResult.items
      .map((item) => item.link)
      .filter((item): item is string => !!item);
  } catch (err) {
    console.log(err);
    return NOT_FOUND;
  }
};

export const habrParser = async (): Promise<string[]> => {
  const rssParser = new RssParser();
  try {
    const parseResult = await rssParser.parseURL(
      'https://habr.com/ru/rss/flows/develop/all/?fl=ru',
    );

    return parseResult.items
      .map((item) => item.link)
      .filter((item): item is string => !!item);
  } catch (err) {
    console.log(err);
    return NOT_FOUND;
  }
};

interface XakerEntity {
  title: string;
  url: string;
  desc: string;
}

export const xakepParser = async (): Promise<string[]> => {
  const URL = encodeURI(
    `https://wrapapi.com/use/dezmunt1/xakep/news/1.0.0?wrapAPIKey=${process.env.WRAPAPI_TOKEN}`,
  );
  try {
    const { data } = await axios.get<{ data: { article: XakerEntity[] } }>(URL);

    return data.data.article.map((article) => article.url);
  } catch (err) {
    console.log(err);
    return NOT_FOUND;
  }
};

const articleParser = {
  comss: comssParser,
  xakep: xakepParser,
  habr: habrParser,
};

export default articleParser;
