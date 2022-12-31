import { Context } from 'telegraf';

export interface Error {
  message: string;
}

export interface Match {
  match: string[];
}

export interface ContextWithMatch extends Context, Match {}
