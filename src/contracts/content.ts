import { Document } from 'mongoose';
import { Chat } from './chat';

export const imageSizes = [
  'small',
  'medium',
  'big',
  'big_plus',
  'full_size',
] as const;

export const contentType = [
  'animation',
  'audio',
  'photo',
  'links',
  'video',
  'videonote',
  'voicenote',
] as const;

export type ImageSize = typeof imageSizes[number];
export type ContentType = typeof contentType[number];

export interface Image {
  size: ImageSize;
  fileId: string;
}

export interface Content {
  messageId: number;
  type: ContentType;
  fromChat?: Chat;
  fileId?: string;
  caption?: string;
  sizes?: Image[];
}

export interface ContentDocument extends Content, Document {}
