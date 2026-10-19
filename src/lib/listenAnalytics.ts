/**
 * Measurement for the listen landing pages.
 *
 * Two events, each dispatched to every active sink:
 *   - page view               (counter `page_view`; standard PageView on Meta)
 *   - spotify_outbound_click  (counter `spotify_tap`; custom event on Meta, fired once per link activation)
 *
 * Our own cookie-free counter runs for every visitor. The Meta sinks (browser
 * Pixel and the server-side Conversions API relay) are attached only when a
 * Pixel ID was set at build time and run only after the visitor accepts (see
 * consent.ts). Every call is synchronous, non-blocking and swallows its own
 * errors so the Spotify link never waits on analytics.
 */
import { hasTrackingConsent, setStoredConsent } from './consent';
import type { CampaignParams } from './campaignParams';

export const SPOTIFY_OUTBOUND_EVENT = 'spotify_outbound_click';

// Netlify Functions, named so ad blockers' generic "track"/"analytics" rules leave them alone.
const COUNTER_ENDPOINT = '/.netlify/functions/relay';
const META_SERVER_ENDPOINT = '/.netlify/functions/relay-forward';

export type ListenPageViewEvent = {
  trackSlug: string;
  campaign: CampaignParams;
};

export type SpotifyOutboundEvent = {
  trackSlug: string;
  destinationUrl: string;
  destination: 'spotify' | 'presave';
  campaign: CampaignParams;
};

type OutboundPayload = CampaignParams & {
  track_slug: string;
  destination: 'spotify' | 'presave';
};

interface AnalyticsSink {
  readonly name: string;
  /** Sinks that set cookies or contact third parties must return true here. */
  readonly requiresConsent: boolean;
  pageView(event: ListenPageViewEvent): void;
  outbound(payload: OutboundPayload, eventId: string): void;
}

// Injected at build time by webpack.DefinePlugin (see webpack.config.js).
const META_PIXEL_ID = (process.env.LISTEN_META_PIXEL_ID || '').trim();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** A same-origin POST that survives the page unloading into Spotify. */
function beacon(url: string, body: Record<string, unknown>): void {
  const data = JSON.stringify(body);
  try {
    // A string body goes as text/plain, which needs no CORS preflight.
    if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url, data)) return;
  } catch {
    // Fall through to fetch.
  }
  if (typeof fetch === 'function') {
    fetch(url, { method: 'POST', body: data, keepalive: true, credentials: 'same-origin' }).catch(() => {});
  }
}

// --- Our counter (cookie-free, every visitor) -------------------------------

const counterSink: AnalyticsSink = {
  name: 'counter',
  requiresConsent: false,
  pageView(event) {
    beacon(COUNTER_ENDPOINT, { event: 'page_view', slug: event.trackSlug, content: event.campaign.utm_content });
  },
  outbound(payload) {
    beacon(COUNTER_ENDPOINT, { event: 'spotify_tap', slug: payload.track_slug, content: payload.utm_content });
  },
};

// --- Meta Pixel -----------------------------------------------------------

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
  push: unknown;
};

type PixelWindow = Window & { fbq?: Fbq; _fbq?: Fbq };

function ensureMetaPixel(pixelId: string): Fbq {
  const w = window as PixelWindow;
  if (w.fbq) return w.fbq;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  } as Fbq;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.push = fbq;
  w.fbq = fbq;
  if (!w._fbq) w._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  // No automatic button-click or page-metadata events: only the two we send.
  fbq('set', 'autoConfig', false, pixelId);
  fbq('init', pixelId);
  return fbq;
}

function metaPixelSink(pixelId: string): AnalyticsSink {
  return {
    name: 'meta-pixel',
    requiresConsent: true,
    pageView() {
      ensureMetaPixel(pixelId)('track', 'PageView');
    },
    outbound(payload, eventId) {
      // The server relay sends the same event with this id; Meta counts the pair once.
      ensureMetaPixel(pixelId)('trackCustom', SPOTIFY_OUTBOUND_EVENT, payload, { eventID: eventId });
    },
  };
}

// --- Meta Conversions API, via our function ---------------------------------

const metaServerSink: AnalyticsSink = {
  name: 'meta-server',
  requiresConsent: true,
  pageView() {
    // Only the outbound tap goes server-side.
  },
  outbound(payload, eventId) {
    beacon(META_SERVER_ENDPOINT, { event_id: eventId, url: window.location.href, data: payload });
  },
};

const META_COOKIES = ['_fbp', '_fbc'];

/** Best effort: expire the Pixel's first-party cookies on this host and each parent domain. */
function clearMetaCookies(): void {
  const parts = window.location.hostname.split('.');
  const domains = [''];
  for (let i = 0; i < parts.length - 1; i += 1) domains.push(`; domain=.${parts.slice(i).join('.')}`);
  for (const name of META_COOKIES) {
    for (const domain of domains) document.cookie = `${name}=; Max-Age=0; path=/${domain}`;
  }
}

// --- Development console --------------------------------------------------

const consoleSink: AnalyticsSink = {
  name: 'console',
  requiresConsent: false,
  pageView(event) {
    console.info('[listen] page_view', event);
  },
  outbound(payload, eventId) {
    console.info(`[listen] ${SPOTIFY_OUTBOUND_EVENT}`, { ...payload, eventId });
  },
};

// --- Dispatcher -----------------------------------------------------------

const sinks: AnalyticsSink[] = [counterSink];
if (META_PIXEL_ID) sinks.push(metaPixelSink(META_PIXEL_ID), metaServerSink);
if (!IS_PRODUCTION) sinks.push(consoleSink);

export function configuredSinkNames(): string[] {
  return sinks.map((sink) => sink.name);
}

/** True when this build can send anything to Meta, i.e. the consent question is worth asking. */
export function metaMeasurementConfigured(): boolean {
  return Boolean(META_PIXEL_ID);
}

function activeSinks(): AnalyticsSink[] {
  const consent = hasTrackingConsent();
  return sinks.filter((sink) => !sink.requiresConsent || consent);
}

function safely(sink: AnalyticsSink, run: () => void): void {
  try {
    run();
  } catch (error) {
    if (!IS_PRODUCTION) console.warn(`[listen] sink "${sink.name}" failed`, error);
  }
}

function newEventId(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// The current page view, kept so a sink that becomes active later (Accept) still receives it once.
let currentPageView: ListenPageViewEvent | null = null;
const pageViewSentTo = new Set<string>();

function dispatchPageView(): void {
  if (!currentPageView) return;
  const event = currentPageView;
  for (const sink of activeSinks()) {
    if (pageViewSentTo.has(sink.name)) continue;
    pageViewSentTo.add(sink.name);
    safely(sink, () => sink.pageView(event));
  }
}

export function recordListenPageView(event: ListenPageViewEvent): void {
  currentPageView = event;
  pageViewSentTo.clear();
  dispatchPageView();
}

/**
 * Applies the visitor's banner choice. Accepting loads the Pixel and sends this
 * page's PageView; declining stops further Meta events and removes Meta's cookies.
 */
export function updateListenConsent(state: 'granted' | 'denied'): void {
  setStoredConsent(state);
  if (!META_PIXEL_ID) return;
  try {
    // Only matters when the Pixel already loaded earlier on this page.
    const fbq = (window as PixelWindow).fbq;
    if (fbq) fbq('consent', state === 'granted' ? 'grant' : 'revoke');
    if (state === 'denied') clearMetaCookies();
  } catch (error) {
    if (!IS_PRODUCTION) console.warn('[listen] consent update failed', error);
  }
  if (state === 'granted') dispatchPageView();
}

/** The same activation observed twice inside this window is recorded once. */
const OUTBOUND_DEDUP_WINDOW_MS = 1000;
let lastOutbound: { key: string; at: number } | null = null;

/**
 * Records one Spotify link activation. Call it from the link's click handler
 * without preventing default: navigation continues regardless of what happens here.
 * Returns the event id, or null when the activation was a duplicate.
 */
export function recordSpotifyOutbound(event: SpotifyOutboundEvent): string | null {
  const now = Date.now();
  const key = `${event.trackSlug}|${event.destinationUrl}`;
  if (lastOutbound && lastOutbound.key === key && now - lastOutbound.at < OUTBOUND_DEDUP_WINDOW_MS) {
    return null;
  }
  lastOutbound = { key, at: now };

  const eventId = newEventId();
  const payload: OutboundPayload = {
    track_slug: event.trackSlug,
    destination: event.destination,
    ...event.campaign,
  };
  for (const sink of activeSinks()) safely(sink, () => sink.outbound(payload, eventId));
  return eventId;
}
