/**
 * Shared pieces of the listen page relay functions: our cookie-free counter
 * (relay, relay-totals) and the Meta Conversions API forwarder (relay-forward).
 */
import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';
import listenData from '../../../src/data/listenTracks.json';

export const COUNTER_EVENTS = ['page_view', 'spotify_tap'] as const;
export type CounterEvent = (typeof COUNTER_EVENTS)[number];

export const DEVICE_CLASSES = ['instagram', 'facebook', 'mobile', 'desktop', 'bot'] as const;
export type DeviceClass = (typeof DEVICE_CLASSES)[number];

export const LISTEN_SLUGS: ReadonlySet<string> = new Set(listenData.tracks.map((track) => track.slug));

/** Placeholder segment for visits without utm_content. */
export const NO_CONTENT = '-';

const MAX_BODY_BYTES = 2048;

export function isProductionDeploy(context: Context): boolean {
  const deployContext = (context.deploy && context.deploy.context) || process.env.CONTEXT || 'production';
  return deployContext === 'production';
}

/**
 * Deploy previews, branch deploys and `netlify dev` count into their own store,
 * so test visits never mix with the production totals.
 */
export function counterStore(context: Context, consistency: 'eventual' | 'strong' = 'eventual') {
  return getStore({ name: isProductionDeploy(context) ? 'listen-counter' : 'listen-counter-preview', consistency });
}

/** UTC calendar day, YYYY-MM-DD. */
export function utcDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Coarse device class from the user agent. Only this label is stored, never the
 * user agent itself. In-app browsers come first: they are mobile too.
 */
export function deviceClass(userAgent: string): DeviceClass {
  if (!userAgent || /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|preview/i.test(userAgent)) return 'bot';
  if (/Instagram/i.test(userAgent)) return 'instagram';
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A/.test(userAgent)) return 'facebook';
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

/** utm_content as stored: printable, trimmed and short enough to keep blob keys well under their 600-byte limit. */
export function cleanContent(value: unknown): string {
  if (typeof value !== 'string') return NO_CONTENT;
  let chars = Array.from(value.replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, 100);
  while (chars.length && encodeURIComponent(chars.join('')).length > 300) chars = chars.slice(0, -1);
  return chars.length ? chars.join('') : NO_CONTENT;
}

/**
 * Rejects requests another site's page sent (a cheap guard against counts
 * inflated from elsewhere; it does not stop a determined script).
 */
export function isCrossSite(req: Request): boolean {
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return true;
  const origin = req.headers.get('origin');
  if (origin && origin !== 'null') {
    try {
      return new URL(origin).host !== new URL(req.url).host;
    } catch {
      return true;
    }
  }
  return false;
}

/** Parses the small JSON body a beacon sends (as text/plain). Null when missing, too large or malformed. */
export async function readBeaconBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    if (!text || text.length > MAX_BODY_BYTES) return null;
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function noContent(): Response {
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}

export function methodNotAllowed(allow: string): Response {
  return new Response(null, { status: 405, headers: { Allow: allow } });
}
