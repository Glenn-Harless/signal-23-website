/**
 * Measurement for the listen landing pages.
 *
 * Two events, each dispatched to every configured sink:
 *   - page view               (standard PageView on Meta)
 *   - spotify_outbound_click  (custom event, fired once per link activation)
 *
 * Sinks are attached only when configured and only when the visitor has not
 * opted out. Every call is synchronous, non-blocking and swallows its own
 * errors so the Spotify link never waits on analytics.
 */
import { hasTrackingConsent } from './consent';
import type { CampaignParams } from './campaignParams';

export const SPOTIFY_OUTBOUND_EVENT = 'spotify_outbound_click';

export type ListenPageViewEvent = {
  trackSlug: string;
  campaign: CampaignParams;
};

export type SpotifyOutboundEvent = {
  trackSlug: string;
  destinationUrl: string;
  campaign: CampaignParams;
};

type OutboundPayload = CampaignParams & {
  track_slug: string;
  destination: 'spotify';
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
      // eventID lets a future Conversions API call deduplicate against this browser event.
      ensureMetaPixel(pixelId)('trackCustom', SPOTIFY_OUTBOUND_EVENT, payload, { eventID: eventId });
    },
  };
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

const sinks: AnalyticsSink[] = [];
if (META_PIXEL_ID) sinks.push(metaPixelSink(META_PIXEL_ID));
if (!IS_PRODUCTION) sinks.push(consoleSink);

export function configuredSinkNames(): string[] {
  return sinks.map((sink) => sink.name);
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

export function recordListenPageView(event: ListenPageViewEvent): void {
  for (const sink of activeSinks()) safely(sink, () => sink.pageView(event));
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
    destination: 'spotify',
    ...event.campaign,
  };
  for (const sink of activeSinks()) safely(sink, () => sink.outbound(payload, eventId));
  return eventId;
}
