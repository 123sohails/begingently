export const locales = ['en', 'ur', 'te'] as const;
export type Locale = (typeof locales)[number];

export type NavDictionary = {
  home: string;
  about: string;
  library: string;
};

export type CommonDictionary = {
  siteName: string;
  tagline: string;
  skipToMain: string;
  footer: string;
  backToLibrary: string;
  readMore: string;
};

export type PageDictionary = {
  title: string;
  description: string;
  content: string[];
};

export type Dictionary = {
  nav: NavDictionary;
  common: CommonDictionary;
  pages: Record<string, PageDictionary>;
};
