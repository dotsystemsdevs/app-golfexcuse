import { EXCUSE_COUNT, CATEGORY_KEYS } from '@/lib/excuses';

const SITE_URL = 'https://excusecaddie.xyz';

export default function sitemap() {
  const lastModified = new Date();

  const home = {
    url: `${SITE_URL}/`,
    lastModified,
    changeFrequency: 'daily',
    priority: 1.0,
  };

  const categoryPages = CATEGORY_KEYS.map((key) => ({
    url: `${SITE_URL}/c/${key}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const excusePages = Array.from({ length: EXCUSE_COUNT }, (_, i) => ({
    url: `${SITE_URL}/${i + 1}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [home, ...categoryPages, ...excusePages];
}
