import { EXCUSE_COUNT } from '@/lib/excuses';

const SITE_URL = 'https://excusecaddie.xyz';

export default function sitemap() {
  const lastModified = new Date();

  const home = {
    url: `${SITE_URL}/`,
    lastModified,
    changeFrequency: 'daily',
    priority: 1.0,
  };

  const excusePages = Array.from({ length: EXCUSE_COUNT }, (_, i) => ({
    url: `${SITE_URL}/${i + 1}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [home, ...excusePages];
}
