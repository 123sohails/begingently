import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '../../lib/types';
import { getDictionary } from '../../lib/i18n';
import { NavBar } from '../../components/NavBar';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: {
    default: 'BeginGently',
    template: '%s | BeginGently',
  },
  description: 'Localized Islamic guidance pages in English, Urdu, and Telugu.',
  applicationName: 'BeginGently',
  metadataBase: new URL('https://begingently.vercel.app'),
  openGraph: {
    type: 'website',
    siteName: 'BeginGently',
    title: 'BeginGently',
    description: 'Localized Islamic guidance pages in English, Urdu, and Telugu.',
    url: 'https://begingently.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BeginGently',
    description: 'Localized Islamic guidance pages in English, Urdu, and Telugu.',
  },
};

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  if (!locales.includes(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);

  return (
    <div lang={locale} dir={locale === 'ur' ? 'rtl' : 'ltr'}>
      <a href="#main-content">{dict.common.skipToMain}</a>
      <NavBar locale={locale} dict={dict} />
      {children}
      <footer>
        <p>{dict.common.footer}</p>
      </footer>
    </div>
  );
}
