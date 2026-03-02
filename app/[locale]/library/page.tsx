import { getDictionary } from '../../../lib/i18n';
import type { Locale } from '../../../lib/types';
import { LibraryGrid } from '../../../components/LibraryGrid';
import { VoiceButton } from '../../../components/VoiceButton';

export default function LibraryPage({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  const page = dict.pages.library;

  return (
    <main id="main-content" className="page-wrap">
      <section className="hero">
        <h1>{page.title}</h1>
        <p>{page.description}</p>
        <VoiceButton locale={locale} targetId="main-content" />
      </section>
      <LibraryGrid locale={locale} dict={dict} />
    </main>
  );
}
