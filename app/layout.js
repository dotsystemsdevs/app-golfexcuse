import './globals.css';

const TAGLINE = 'Tap the button. Get a clubhouse-grade alibi for that round.';

export const metadata = {
  title: 'Excuse Caddie — Golf Excuse Generator',
  metadataBase: new URL('https://excusecaddie.xyz'),
  description: TAGLINE,
  openGraph: {
    title: 'Excuse Caddie',
    description: TAGLINE,
    type: 'website',
    siteName: 'Excuse Caddie',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Excuse Caddie',
    description: TAGLINE,
  },
  icons: { icon: '/favicon.png' },
};

export const viewport = {
  themeColor: '#3D6149',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="h-dvh overflow-hidden selection:bg-white/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
