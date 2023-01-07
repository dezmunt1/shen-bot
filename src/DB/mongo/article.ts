import { ArticleModel } from './models/schemas';
import articleParser from '../../handlers/article/article.util';
import type { Resource } from '@app/handlers/article/article.types';

type ResourceParser = () => Promise<string[]>;

export const getArticle = async (
  resource: Resource,
  resourceParser: ResourceParser,
) => {
  try {
    if (!resource) {
      throw new Error(
        '[articleMongoListener]: Request resource type not specified',
      );
    }

    const articleData = await ArticleModel.findOne({ resource });

    if (!articleData) {
      const articleText = await resourceParser();
      if (!articleText) return ['Статья не найдена!'];

      const newRes = new ArticleModel({
        resource,
        data: articleText,
        funcName: resource,
        date: new Date().toUTCString(),
      });
      await newRes.save();
      return newRes.data;
    }

    return articleData.data;
  } catch (error) {
    console.error((error as Error).message);
    return undefined;
  }
};

export const updateArticles = async () => {
  try {
    const allResources = await ArticleModel.find();
    if (!allResources.length) {
      throw new Error(
        '[updateArticleResources]: В БД действующих ресурсов не существует',
      );
    }

    await Promise.all(
      allResources.map(async (resourceItem) => {
        const { resource, funcName } = resourceItem;

        if (!resource || !funcName) return Promise.resolve();

        console.log(`Начинаю парсить "${resource.toUpperCase()}"`);

        const parsedRosource = await articleParser[funcName]();

        const updateResource = await ArticleModel.updateMany(
          { _id: resourceItem._id },
          {
            date: new Date().toISOString(),
            data: parsedRosource,
          },
        );

        if (updateResource.modifiedCount) {
          console.log(
            `[updateArticleResources]: Ресурс "${resource.toUpperCase()}" успешно отпарсен, и записан в БД`,
          );
        }
      }),
    );
  } catch (error) {
    console.error(error);
  }
};
