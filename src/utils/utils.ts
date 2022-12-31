import bcrypt from 'bcryptjs';

export const hashPassword = async (password = '123') => {
  const soltRound = +process.env.HASH_SALT!;
  const solt = await bcrypt.genSalt(soltRound);
  const hash = await bcrypt.hash(password, solt);
  return hash;
};
export const hashPasswordSync = (password = '123') => {
  const soltRound = +process.env.HASH_SALT!;
  const solt = bcrypt.genSaltSync(soltRound);
  const hash = bcrypt.hashSync(password, solt);
  return hash;
};
export const checkHashPassword = async (password: string, hash: string) => {
  const check = await bcrypt.compare(password, hash);
  return check;
};
