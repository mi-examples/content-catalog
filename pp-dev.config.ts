import { PPDevConfig } from '@metricinsights/pp-dev';

/**
 * Portal Page (app) ID on the MI instance. pp-dev reads that page's Variables and
 * substitutes the `[Variable Name]` placeholders declared in index.html.
 *
 * Set MI_APP_ID in .env once the Portal Page exists (see README.md). Until then the
 * dev server runs template-less: the placeholders stay unsubstituted and the app
 * falls back to the defaults in src/constants.ts.
 */
const config: PPDevConfig = {
  backendBaseURL: 'https://ca-dev-latest.metricinsights.com',
  portalPageId: 91,
  v7Features: true,
  miHudLess: true,
};

export default config;
