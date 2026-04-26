import './globals.css';

const TAGLINE = 'A simple alibi for your round. Copy or share in one step.';

export const metadata = {
  title: 'Bogey Blamer — Golf Excuse Generator',
  description: TAGLINE,
  openGraph: {
    title: 'Bogey Blamer — Golf Excuse Generator',
    description: TAGLINE,
    type: 'website',
    siteName: 'Bogey Blamer',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bogey Blamer — Golf Excuse Generator',
    description: TAGLINE,
  },
  icons: {
    icon: '/favicon.png',
  },
};

export const viewport = {
  themeColor: '#1f3d2a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="min-h-dvh font-sans antialiased selection:bg-[#c9a227]/25 selection:text-white lg:h-dvh lg:max-h-dvh lg:overflow-hidden"
        style={{ fontFeatureSettings: '"tnum" 1' }}
      >
        {children}
      </body>
    </html>
  );
}
