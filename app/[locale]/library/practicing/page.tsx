import { getDictionary } from '../../../../lib/i18n';
import type { Locale } from '../../../../lib/types';
import { SimplePage } from '../../../../components/SimplePage';

export default function PracticingPage({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const dict = getDictionary(locale);
  return <SimplePage locale={locale} dict={dict} pageKey="practicing" showBackToLibrary />;
}