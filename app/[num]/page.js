import { notFound } from 'next/navigation';
import HomePage from '../page';
import { EXCUSES, EXCUSE_COUNT, CATEGORY_META } from '@/lib/excuses';

const SITE_URL = 'https://excusecaddie.xyz';

function parseNum(value) {
  const n = Number.parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > EXCUSE_COUNT) return null;
  return n;
}

function primaryTag(tags) {
  if (!Array.isArray(tags)) return null;
  return tags.find((t) => CATEGORY_META[t]) || null;
}

export function generateStaticParams() {
  return Array.from({ length: EXCUSE_COUNT }, (_, i) => ({ num: String(i + 1) }));
}

export async function generateMetadata({ params }) {
  const { num } = await params;
  const n = parseNum(num);
  if (!n) return {};
  const text = EXCUSES[n - 1].text;
  const title = `"${text}" — Golf Excuse #${n}`;
  const description = `${text} A ready-made golf alibi from Excuse Caddie — ${EXCUSE_COUNT} ironclad excuses for that round.`;
  const url = `${SITE_URL}/${n}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `"${text}"`,
      description: `Golf excuse #${n} of ${EXCUSE_COUNT} — Excuse Caddie`,
      url,
      type: 'article',
      siteName: 'Excuse Caddie',
    },
    twitter: {
      card: 'summary_large_image',
      title: `"${text}"`,
      description: `Golf excuse #${n} of ${EXCUSE_COUNT} — Excuse Caddie`,
    },
  };
}

export default async function ExcuseNumberPage({ params }) {
  const { num } = await params;
  const n = parseNum(num);
  if (!n) notFound();

  const entry = EXCUSES[n - 1];
  const text = entry.text;
  const url = `${SITE_URL}/${n}`;
  const tag = primaryTag(entry.tags);

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Excuse Caddie', item: SITE_URL },
  ];
  if (tag) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: CATEGORY_META[tag].headline,
      item: `${SITE_URL}/c/${tag}`,
    });
  }
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: `Excuse #${n}`,
    item: url,
  });

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: text,
    description: `Golf excuse #${n} of ${EXCUSE_COUNT} — Excuse Caddie`,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: `${SITE_URL}/${n}/opengraph-image`,
    articleSection: tag ? CATEGORY_META[tag].label : 'Golf',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#org` },
    inLanguage: 'en',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <HomePage initialPickNumber={n} />
    </>
  );
}
