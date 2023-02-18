export const postmeContents = [
  'animation',
  'audio',
  'photo',
  'links',
  'video',
  'videonote',
  'voicenote',
  'full',
] as const;

export type PostmeContent = typeof postmeContents[number];

export type PostmePermissions = `postme.${PostmeContent}`;

export interface PostmeSession {
  dialogMessageId?: number;
  password?: string;
}

export enum PostmeActions {
  SelectSource = 'postme:selectSource',
  SelectSourceChat = 'postme:SelectSourceChat',
  OpenOptions = 'postme:openOptions',
  SetAsSource = 'postme:setAsSource',
  RemoveSource = 'postme:removeSource',
  SelectContentType = 'postme:selectContentType',
  SetPassword = 'postme:setPassword',
  GetMore = 'postme:getMore',
}
