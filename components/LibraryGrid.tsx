import Link from 'next/link';
import type { Locale } from '../lib/types';
import type { Dictionary } from '../lib/types';

type Card = {
  href: string;
  key: string;
};

type Props = {
  locale: Locale;
  dict: Dictionary;
};

const cards: Card[] = [
  { href: 'starter-plan', key: 'starterPlan' },
  { href: 'salah', key: 'salah' },
  { href: 'quran', key: 'quran' },
  { href: 'prophet', key: 'prophet' },
  { href: 'hadith', key: 'hadith' },
  { href: 'beliefs', key: 'beliefs' },
  { href: 'practicing', key: 'practicing' },
  { href: 'proofs', key: 'proofs' },
  { href: 'resources', key: 'resources' },
  { href: 'common-questions', key: 'commonQuestions' },
  { href: 'scholars-websites', key: 'scholarsWebsites' },
  { href: 'books', key: 'books' },
];

export function LibraryGrid({ locale, dict }: Props) {
  return (
    <section className="grid">
      {cards.map((card) => {
        const page = dict.pages[card.key];
        return (
          <article key={card.key} className="card">
            <h3>{page.title}</h3>
            <p>{page.description}</p>
            <Link href={`/${locale}/library/${card.href}`}>{dict.common.readMore}</Link>
          </article>
        );
      })}
    </section>
  );
}
