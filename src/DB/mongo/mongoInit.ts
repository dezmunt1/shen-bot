import mongoose from 'mongoose';
import { AdminModel } from './models/schemas';

let i = 1;

export class Connect {
  public path: string | undefined;

  public instance: number;

  constructor(path: string) {
    this.path = path;
    this.instance = i;
    this.connect();
  }

  connect = async () => {
    if (!this.path) throw 'Отсутсвует путь до БД';
    try {
      await mongoose.connect(this.path, async (error) => {
        if (!error) {
          console.log(`[Server]: БД MongoDB успешно подключена`);
          const admin = await AdminModel.findOne();
          if (admin) {
            return;
          }
          new AdminModel().save();
          console.log(
            `[Server]: Создана стандартная учётная запись админа, смените пароль`,
          );
        } else {
          console.log(`[Server]: ${error}`);
        }
      });
      const db = mongoose.connection;
      db.on('error', console.error.bind(console, 'connection error:'));
      db.once(
        'open',
        console.log.bind(console, `Соединение c БД "${db.name}" установлено`),
      );
      this.instance = i++;
    } catch (error) {
      console.log(error);
    }
  };
}

export default Connect;
