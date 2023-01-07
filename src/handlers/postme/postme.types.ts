export const postmeContents = [
  'links',
  'photo',
  'video',
  'audio',
  'full',
] as const;

export type PostmeContent = typeof postmeContents[number];

export type PostmePermissions = `postme.${PostmeContent}`;

export interface PostmeSession {
  dialogMessageId?: number;
  password?: string;
}
