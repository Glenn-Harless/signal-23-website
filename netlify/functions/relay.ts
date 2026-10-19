/**
 * Our own cookie-free counter for the listen pages: one `page_view` per page
 * load and one `spotify_tap` per Spotify button activation, for every visitor
 * whatever their consent choice. Sent with navigator.sendBeacon.
 *
 * Each hit is stored as a one-byte marker blob whose key holds the only things we
 * keep: UTC day, track slug, event, device class and utm_content. No IP address,
 * user agent, cookie or timestamp finer than the day. One blob per hit means
 * concurrent writes never lose counts; relay-totals adds them up by day.
 *
 * POST /.netlify/functions/relay  {"event":"page_view","slug":"pulsar-04","content":"<utm_content>"}
 */
import { randomUUID } from 'crypto';
import type { Context } from '@netlify/functions';
import {
  COUNTER_EVENTS,
  CounterEvent,
  LISTEN_SLUGS,
  cleanContent,
  counterStore,
  deviceClass,
  isCrossSite,
  methodNotAllowed,
  noContent,
  readBeaconBody,
  utcDay,
} from './utils/relay';

export default async (req: Request, context: Context): Promise<Response> => {
  if (req.method !== 'POST') return methodNotAllowed('POST');
  if (isCrossSite(req)) return new Response(null, { status: 403 });

  const body = await readBeaconBody(req);
  if (!body) return new Response(null, { status: 400 });
  const { event, slug } = body;
  if (typeof event !== 'string' || !(COUNTER_EVENTS as readonly string[]).includes(event)) {
    return new Response(null, { status: 400 });
  }
  if (typeof slug !== 'string' || !LISTEN_SLUGS.has(slug)) return new Response(null, { status: 400 });

  const key = [
    utcDay(),
    slug,
    event as CounterEvent,
    deviceClass(req.headers.get('user-agent') || ''),
    encodeURIComponent(cleanContent(body.content)),
    randomUUID(),
  ].join('/');

  try {
    await counterStore(context).set(key, '1');
  } catch (error) {
    console.error('relay: could not store hit', error instanceof Error ? error.message : error);
    return new Response(null, { status: 503 });
  }
  return noContent();
};
