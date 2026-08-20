import axios from 'axios';

/** Metric Insights REST API (/api/*). pp-dev proxies these to backendBaseURL. */
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/** Non-REST MI endpoints that live outside /api (e.g. /index/index/user-info). */
export const root = axios.create({
  baseURL: '/',
  headers: {
    Accept: 'application/json',
  },
});

/**
 * Fixtures mode. Set VITE_USE_FIXTURES=1 to render the UI from the bundled
 * JSON in src/api/fixtures instead of calling the MI instance — useful before
 * the Portal Page exists or when there is no MI session to authenticate with.
 */
export const USE_FIXTURES = import.meta.env.VITE_USE_FIXTURES === '1';

export const swrConfig = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
} as const;
