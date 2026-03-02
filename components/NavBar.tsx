import Link from 'next/link';
import type { Locale } from '../lib/types';
import type { Dictionary } from '../lib/types';

type Props = {
  locale: Locale;
  dict: Dictionary;
};

export function NavBar({ locale, dict }: Props) {
  return (
    <nav aria-label="Main navigation" className="navbar">
      <Link href={`/${locale}`} className="logo">
        {dict.common.siteName}
      </Link>
      <ul className="nav-links">
        <li><Link href={`/${locale}`}>{dict.nav.home}</Link></li>
        <li><Link href={`/${locale}/about`}>{dict.nav.about}</Link></li>
        <li><Link href={`/${locale}/library`}>{dict.nav.library}</Link></li>
      </ul>
    </nav>
  );
}
