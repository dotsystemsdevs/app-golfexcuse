import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { EXCUSE_COUNT } from '@/lib/excuses';

const TAGLINE = 'Tap the button. Get an ironclad excuse for that round.';
const LONG_DESCRIPTION = `Excuse Caddie — the random golf excuse generator. ${EXCUSE_COUNT} ready-made alibis for shanks, three-putts, and triple bogeys. Tap once, blame the wind.`;

export const metadata = {
  title: {
    default: 'Excuse Caddie — Random Golf Excuse Generator',
    template: '%s | Excuse Caddie',
  },
  metadataBase: new URL('https://excusecaddie.xyz'),
  description: LONG_DESCRIPTION,
  applicationName: 'Excuse Caddie',
  keywords: [
    'golf excuse generator',
    'random golf excuses',
    'funny golf excuses',
    'golf alibi',
    'bad round excuses',
    'mulligan generator',
    'caddie excuses',
    'golf jokes',
  ],
  category: 'sports',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Excuse Caddie — Random Golf Excuse Generator',
    description: LONG_DESCRIPTION,
    type: 'website',
    siteName: 'Excuse Caddie',
    url: 'https://excusecaddie.xyz',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Excuse Caddie — Random Golf Excuse Generator',
    description: TAGLINE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: { icon: '/favicon.png' },
};

export const viewport = {
  themeColor: '#508560',
  width: 'device-width',
  initialScale: 1,
};

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://excusecaddie.xyz/#website',
      url: 'https://excusecaddie.xyz/',
      name: 'Excuse Caddie',
      alternateName: ['ExcuseCaddie', 'The Excuse Caddie'],
      description: LONG_DESCRIPTION,
      inLanguage: 'en',
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://excusecaddie.xyz/#app',
      name: 'Excuse Caddie',
      url: 'https://excusecaddie.xyz/',
      applicationCategory: 'EntertainmentApplication',
      applicationSubCategory: 'Golf',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      description: LONG_DESCRIPTION,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isAccessibleForFree: true,
    },
    {
      '@type': 'Organization',
      '@id': 'https://excusecaddie.xyz/#org',
      name: 'Excuse Caddie',
      url: 'https://excusecaddie.xyz/',
      logo: 'https://excusecaddie.xyz/logo.png',
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://excusecaddie.xyz/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Excuse Caddie?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Excuse Caddie is a free random golf excuse generator. Tap one button and get an ironclad alibi for the round you would rather forget — shanked drives, three-putts, lost balls. ${EXCUSE_COUNT} hand-curated golf excuses across 8 categories.`,
          },
        },
        {
          '@type': 'Question',
          name: 'How many golf excuses are there?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `There are currently ${EXCUSE_COUNT} excuses, weighted so the same line never repeats back-to-back. Every excuse also has its own URL (excusecaddie.xyz/1 through /${EXCUSE_COUNT}) so you can deep-link directly to a specific ruling.`,
          },
        },
        {
          '@type': 'Question',
          name: 'Do I need an account to use Excuse Caddie?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. There are no accounts, no signups, and no tracking beyond anonymous Vercel Analytics events for product improvement. The whole site is one screen, one button.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I contribute new excuses?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. The project is open source on GitHub at github.com/dotsystemsdevs/excuse-caddie. Add lines to lib/excuses.js or open an issue with the "Add more excuses" template.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Excuse Caddie free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Free, no ads, no paywalls. The maintainer accepts tips via Buy Me a Coffee but nothing on the site requires payment.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
      </head>
      <body className="min-h-dvh selection:bg-white/30 selection:text-white">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
