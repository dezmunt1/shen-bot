import mongoose, { Types } from 'mongoose';

export interface IObjectId extends mongoose.Types.ObjectId {}

export default function toObjectId(value: string | Types.ObjectId | undefined) {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return undefined;

  return new mongoose.Types.ObjectId(value);
}
