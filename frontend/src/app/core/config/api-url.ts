declare global {
  interface Window {
    EDU_FOOD_CONFIG?: { apiBaseUrl?: string };
  }
}

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '/api';
  if (window.location.port === '4200') return 'http://localhost:5000/api';
  const configuredUrl = window.EDU_FOOD_CONFIG?.apiBaseUrl?.trim();
  return configuredUrl ? configuredUrl.replace(/\/+$/, '') : '/api';
}

export function isPagesApiMissing(): boolean {
  return typeof window !== 'undefined'
    && window.location.hostname.endsWith('.github.io')
    && !window.EDU_FOOD_CONFIG?.apiBaseUrl?.trim();
}
