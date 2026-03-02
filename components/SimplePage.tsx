import Link from 'next/link';
import type { Locale } from '../lib/types';
import type { Dictionary } from '../lib/types';

type Props = {
  locale: Locale;
  dict: Dictionary;
  pageKey: string;
  showBackToLibrary?: boolean;
};

export function SimplePage({ locale, dict, pageKey, showBackToLibrary }: Props) {
  const page = dict.pages[pageKey];

  return (
    <main id="main-content" className="page-wrap">
      <section className="hero">
        <h1>{page.title}</h1>
        <p>{page.description}</p>
        {showBackToLibrary ? (
          <Link href={`/${locale}/library`} className="back-link">{dict.common.backToLibrary}</Link>
        ) : null}
      </section>
      <section>
        {page.content.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </section>
    </main>
  );
}
