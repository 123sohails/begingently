import type { Locale } from './types';
import type { Dictionary } from './types';
import { en } from '../messages/en';
import { ur } from '../messages/ur';
import { te } from '../messages/te';

const dictionaries: Record<Locale, Dictionary> = { en, ur, te };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}

export function getPage(locale: Locale, key: string) {
  const dict = getDictionary(locale);
  return dict.pages[key] ?? dict.pages.home;
}
