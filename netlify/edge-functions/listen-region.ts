/**
 * Sets the consent mode of the static /listen/<slug>/ pages from the
 * visitor's country before the page reaches the browser.
 *
 * The built HTML ships `data-consent="opt-in"` (banner first, no Meta until
 * Accept). For visitors Netlify places outside the EU/EEA, UK and Switzerland
 * this flips it to `opt-out` (no banner, Meta on unless they opt out). Unknown
 * countries and any failure here leave the page opt-in.
 */
import { consentModeForCountry } from '../shared/consentRegions.ts';

type EdgeContext = {
  geo?: { country?: { code?: string } };
  next: () => Promise<Response>;
};

const OPT_IN_ATTRIBUTE = 'data-consent="opt-in"';

export default async (_request: Request, context: EdgeContext): Promise<Response> => {
  const response = await context.next();
  if (response.status !== 200 || !(response.headers.get('content-type') || '').includes('text/html')) return response;
  if (consentModeForCountry(context.geo?.country?.code) === 'opt-in') return response;

  const html = await response.text();
  const headers = new Headers(response.headers);
  // The body now depends on the visitor's country: no shared validators, no stale reuse.
  headers.delete('content-length');
  headers.delete('etag');
  headers.set('cache-control', 'private, no-cache');
  return new Response(html.replace(OPT_IN_ATTRIBUTE, 'data-consent="opt-out"'), { status: 200, headers });
};

export const config = {
  path: '/listen/*',
  excludedPath: ['/listen/*.jpg', '/listen/*.png', '/listen/*.webp', '/listen/*.mp4'],
};
