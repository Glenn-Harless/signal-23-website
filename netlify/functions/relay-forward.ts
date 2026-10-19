/**
 * Meta Conversions API relay for the listen pages. The browser calls this only
 * where the Pixel is allowed (see src/lib/consent.ts), with the same event id
 * as the Pixel's `spotify_outbound_click`, so Meta counts the pair once while
 * still receiving the tap when the Pixel request is blocked or cut off by the
 * jump to Spotify.
 *
 * Does nothing (204) unless LISTEN_META_PIXEL_ID and META_CAPI_TOKEN are set
 * for this deploy, when the request carries Global Privacy Control, or when a
 * visitor from an opt-in country (or an unknown one) has not explicitly
 * accepted. META_TEST_EVENT_CODE routes events to Events Manager's Test Events tab.
 *
 * POST /.netlify/functions/relay-forward
 *   {"event_id":"…","url":"https://signal23.net/listen/pulsar-04/?utm_…","consent":"granted"|"default",
 *    "data":{"track_slug":"pulsar-04","destination":"spotify","utm_content":"…"}}
 */
import type { Context } from '@netlify/functions';
import { consentModeForCountry } from '../shared/consentRegions';
import { LISTEN_SLUGS, isCrossSite, methodNotAllowed, noContent, readBeaconBody } from './utils/relay';

const GRAPH_API = 'https://graph.facebook.com/v23.0';
const EVENT_NAME = 'spotify_outbound_click';
const EVENT_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;
const DESTINATIONS = new Set(['spotify', 'presave']);
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const META_TIMEOUT_MS = 5000;

function shortString(value: unknown, max = 120): string | undefined {
  if (typeof value !== 'string') return undefined;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
  return clean || undefined;
}

/** The listen page URL the tap happened on; must be on this site. */
function listenPageUrl(value: unknown, req: Request): URL | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.host !== new URL(req.url).host || !url.pathname.startsWith('/listen/')) return null;
    return url;
  } catch {
    return null;
  }
}

/** Meta's click id: the _fbc cookie when the Pixel set one, else built from the landing URL's fbclid. */
function clickId(context: Context, pageUrl: URL): string | undefined {
  const cookie = context.cookies.get('_fbc');
  if (cookie) return cookie;
  const fbclid = pageUrl.searchParams.get('fbclid');
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;
}

export default async (req: Request, context: Context): Promise<Response> => {
  if (req.method !== 'POST') return methodNotAllowed('POST');
  if (isCrossSite(req)) return new Response(null, { status: 403 });

  const pixelId = (process.env.LISTEN_META_PIXEL_ID || '').trim();
  const token = (process.env.META_CAPI_TOKEN || '').trim();
  if (!pixelId || !token) return noContent();
  if (req.headers.get('sec-gpc') === '1') return noContent();

  const body = await readBeaconBody(req);
  if (!body) return new Response(null, { status: 400 });
  const country = context.geo && context.geo.country ? context.geo.country.code : undefined;
  if (body.consent !== 'granted' && consentModeForCountry(country) === 'opt-in') return noContent();
  const eventId = body.event_id;
  const pageUrl = listenPageUrl(body.url, req);
  const data = body.data && typeof body.data === 'object' ? (body.data as Record<string, unknown>) : {};
  const slug = data.track_slug;
  if (typeof eventId !== 'string' || !EVENT_ID_PATTERN.test(eventId) || !pageUrl) {
    return new Response(null, { status: 400 });
  }
  if (typeof slug !== 'string' || !LISTEN_SLUGS.has(slug)) return new Response(null, { status: 400 });

  const customData: Record<string, string> = {
    track_slug: slug,
    destination: typeof data.destination === 'string' && DESTINATIONS.has(data.destination) ? data.destination : 'spotify',
  };
  for (const key of UTM_KEYS) {
    const value = shortString(data[key]);
    if (value) customData[key] = value;
  }

  const userData: Record<string, string> = {
    client_ip_address: context.ip,
    client_user_agent: req.headers.get('user-agent') || '',
  };
  const fbp = context.cookies.get('_fbp');
  if (fbp) userData.fbp = fbp;
  const fbc = clickId(context, pageUrl);
  if (fbc) userData.fbc = fbc;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: EVENT_NAME,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: pageUrl.toString(),
        user_data: userData,
        custom_data: customData,
      },
    ],
    // In the body rather than the query string so the token never appears in request logs.
    access_token: token,
  };
  const testEventCode = (process.env.META_TEST_EVENT_CODE || '').trim();
  if (testEventCode) payload.test_event_code = testEventCode;

  try {
    const response = await fetch(`${GRAPH_API}/${encodeURIComponent(pixelId)}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(META_TIMEOUT_MS),
    });
    if (!response.ok) {
      // Meta's error text only; never the visitor's IP or user agent.
      const detail = (await response.text()).slice(0, 500);
      console.error(`relay-forward: Meta responded ${response.status}: ${detail}`);
    }
  } catch (error) {
    console.error('relay-forward: Meta request failed', error instanceof Error ? error.message : error);
  }
  return noContent();
};
