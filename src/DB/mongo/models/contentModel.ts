import { model, Schema, Types } from 'mongoose';
import { ContentDocument, contentType, imageSizes } from '../../../contracts';

const contentSchema = new Schema<ContentDocument>({
  fromChat: {
    type: Types.ObjectId,
    ref: 'ChatModel',
  },
  fileId: String,
  type: {
    type: String,
    enum: contentType,
  },
  messageId: String,
  caption: String,
  sizes: [
    {
      size: {
        type: String,
        enum: imageSizes,
      },
      fileId: String,
    },
  ],
});

export const ContentModel = model<ContentDocument>(
  'ContentModel',
  contentSchema,
);
