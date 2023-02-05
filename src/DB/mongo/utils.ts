import mongoose, { Types } from 'mongoose';

export interface IObjectId extends mongoose.Types.ObjectId {}

export const toObjectId = (value: string | Types.ObjectId | undefined) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return undefined;

  return new mongoose.Types.ObjectId(value);
};

export const randomFromArray = <T>(arr: T[]) =>
  arr[Math.floor(Math.random() * arr.length)];
