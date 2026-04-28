import { notFound } from 'next/navigation';
import HomePage from '../page';
import { EXCUSES, EXCUSE_COUNT } from '@/lib/excuses';

const SITE_URL = 'https://excusecaddie.xyz';

function parseNum(value) {
  const n = Number.parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > EXCUSE_COUNT) return null;
  return n;
}

export function generateStaticParams() {
  return Array.from({ length: EXCUSE_COUNT }, (_, i) => ({ num: String(i + 1) }));
}

export async function generateMetadata({ params }) {
  const { num } = await params;
  const n = parseNum(num);
  if (!n) return {};
  const text = EXCUSES[n - 1].text;
  const title = `"${text}" — Golf Excuse #${n} | Excuse Caddie`;
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
  return <HomePage initialPickNumber={n} />;
}
