import Osmosis from 'osmosis';
import axios from 'axios';
import RssParser from 'rss-parser';

type Resource = 'comss' | 'kod' | 'xakep';

export const comssParser = () => {
  const URL = 'https://zapier.com/engine/rss/646640/newscomss/';
  const rssParser = new RssParser();
  const artArr = [];
  return new Promise((res, rej) => {
    rssParser
      .parseURL(URL)
      .then((result) => {
        res(result.items);
      })
      .catch((err) => console.log(err));
  });
};

export const kodParser = () => {
  const URL = 'https://kod.ru/tag/news/';
  const artArr = [];
  return new Promise((res, rej) => {
    Osmosis.get(URL)
      .find('.post-card__title')
      .set({
        articles: '@href',
      })
      .data((item) => {
        artArr.push(item);
      })
      .error((err) => {
        rej(err);
      })
      .done(() => {
        const resultArr = artArr.map((item) => {
          return `https://kod.ru${item.articles}`;
        });
        res(resultArr);
      });
  });
};

export const xakepParser = () => {
  const URL = encodeURI(
    `https://wrapapi.com/use/dezmunt1/xakep/news/0.0.5?wrapAPIKey=${process.env.WRAPAPI_TOKEN}`,
  );
  return new Promise((res, rej) => {
    axios({
      method: 'post',
      url: URL,
    })
      .then((respon) => {
        res(respon.data.data.news);
      })
      .catch((error) => {
        console.log(error);
      });
  });
};
