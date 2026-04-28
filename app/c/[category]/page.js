import Link from 'next/link';
import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import { CATEGORY_KEYS, CATEGORY_META, getExcusesByTag, EXCUSE_COUNT } from '@/lib/excuses';

const SITE_URL = 'https://excusecaddie.xyz';

export function generateStaticParams() {
  return CATEGORY_KEYS.map((key) => ({ category: key }));
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  if (!CATEGORY_KEYS.includes(category)) return {};
  const meta = CATEGORY_META[category];
  const items = getExcusesByTag(category);
  const title = `${meta.headline} (${items.length} ready-made)`;
  const description = `${meta.blurb} ${items.length} of ${EXCUSE_COUNT} hand-curated golf excuses, free to use.`;
  const url = `${SITE_URL}/c/${category}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: meta.headline,
      description,
      url,
      type: 'website',
      siteName: 'Excuse Caddie',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.headline,
      description,
    },
  };
}

export default async function CategoryPage({ params }) {
  const { category } = await params;
  if (!CATEGORY_KEYS.includes(category)) notFound();
  const meta = CATEGORY_META[category];
  const items = getExcusesByTag(category);
  const url = `${SITE_URL}/c/${category}`;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Excuse Caddie', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: meta.headline, item: url },
    ],
  };

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: meta.headline,
    description: meta.blurb,
    url,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/${it.number}`,
        name: it.text,
      })),
    },
  };

  return (
    <main className="min-h-dvh flex flex-col" id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />

      <header
        className="w-full px-5 sm:px-8 py-6 sm:py-8 border-b"
        style={{ background: 'var(--color-fairway-deep)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <nav className="text-[12px] sm:text-[13px] mb-3" style={{ color: 'rgba(245,241,232,0.65)' }}>
          <Link href="/" className="hover:underline" style={{ color: 'var(--color-yellow)' }}>
            Excuse Caddie
          </Link>
          <span aria-hidden> · </span>
          <span>{meta.label}</span>
        </nav>
        <h1
          className="text-[1.8rem] sm:text-[2.4rem] font-extrabold tracking-[-0.025em]"
          style={{ color: 'var(--color-cream)' }}
        >
          {meta.headline}
        </h1>
        <p className="mt-2 text-[14px] sm:text-[15px] max-w-2xl" style={{ color: 'rgba(245,241,232,0.78)' }}>
          {meta.blurb}
        </p>
        <p className="mt-3 text-[12px] uppercase tracking-[0.18em] font-semibold" style={{ color: 'var(--color-yellow)' }}>
          {items.length} rulings
        </p>
      </header>

      <section className="flex-1 w-full px-5 sm:px-8 py-6 sm:py-8 max-w-3xl mx-auto">
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((it) => (
            <li key={it.number}>
              <Link
                href={`/${it.number}`}
                className="block rounded-2xl px-5 py-4 transition-transform hover:-translate-y-0.5"
                style={{
                  background: 'var(--color-cream)',
                  color: '#1A1916',
                  boxShadow: '0 6px 0 rgba(0,0,0,0.10), 0 12px 24px rgba(0,0,0,0.08)',
                }}
              >
                <div className="text-[11px] uppercase tracking-[0.18em] font-bold opacity-50">
                  #{it.number}
                </div>
                <div className="mt-1 text-[15px] sm:text-[16px] font-semibold leading-snug">
                  {it.text}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <nav className="mt-10 flex flex-wrap gap-2 justify-center">
          {CATEGORY_KEYS.filter((k) => k !== category).map((k) => (
            <Link
              key={k}
              href={`/c/${k}`}
              className="text-[12px] sm:text-[13px] font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(245,241,232,0.10)', color: 'var(--color-cream)' }}
            >
              {CATEGORY_META[k].label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-[14px] font-bold uppercase tracking-[0.13em] text-[13px]"
            style={{ background: 'var(--color-yellow)', color: '#1A1916' }}
          >
            Take the Mulligan
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
