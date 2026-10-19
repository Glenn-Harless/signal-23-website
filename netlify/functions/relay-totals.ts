/**
 * Read endpoint for the listen page counter: daily totals of `page_view` and
 * `spotify_tap`, aggregate only. This is the number to compare with Meta's.
 *
 * GET /.netlify/functions/relay-totals
 *   ?days=14            last N UTC days including today (default 14, max 92)
 *   ?from=YYYY-MM-DD    first day; with optional &to=YYYY-MM-DD (default today)
 *   ?slug=pulsar-04     one track only
 */
import type { Context } from '@netlify/functions';
import {
  COUNTER_EVENTS,
  CounterEvent,
  LISTEN_SLUGS,
  NO_CONTENT,
  counterStore,
  isProductionDeploy,
  methodNotAllowed,
  utcDay,
} from './utils/relay';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAYS = 14;
const MAX_DAYS = 92;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type Counts = Record<CounterEvent, number>;
type Row = { slug: string; utm_content: string | null; device: string } & Counts;

function emptyCounts(): Counts {
  return { page_view: 0, spotify_tap: 0 };
}

function parseDay(value: string | null): number | null {
  if (!value || !DAY_PATTERN.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(time) ? null : time;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

function dayRange(params: URLSearchParams): string[] | string {
  const today = parseDay(utcDay()) as number;
  let from: number;
  let to = today;
  if (params.has('from')) {
    const parsedFrom = parseDay(params.get('from'));
    if (parsedFrom === null) return 'from must be YYYY-MM-DD';
    from = parsedFrom;
    if (params.has('to')) {
      const parsedTo = parseDay(params.get('to'));
      if (parsedTo === null) return 'to must be YYYY-MM-DD';
      to = parsedTo;
    }
  } else {
    const days = params.has('days') ? Number(params.get('days')) : DEFAULT_DAYS;
    if (!Number.isInteger(days) || days < 1) return 'days must be a positive whole number';
    from = today - (Math.min(days, MAX_DAYS) - 1) * DAY_MS;
  }
  if (to < from) return 'to is before from';
  if ((to - from) / DAY_MS + 1 > MAX_DAYS) return `at most ${MAX_DAYS} days per request`;

  const out: string[] = [];
  for (let t = from; t <= to; t += DAY_MS) out.push(utcDay(new Date(t)));
  return out;
}

function decodeContent(segment: string): string | null {
  if (segment === NO_CONTENT) return null;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function addTo<T extends Counts>(map: Map<string, T>, key: string, make: () => T, event: CounterEvent): void {
  let entry = map.get(key);
  if (!entry) {
    entry = make();
    map.set(key, entry);
  }
  entry[event] += 1;
}

function byPageViews<T extends Counts>(a: T, b: T): number {
  return b.page_view - a.page_view || b.spotify_tap - a.spotify_tap;
}

export default async (req: Request, context: Context): Promise<Response> => {
  if (req.method !== 'GET') return methodNotAllowed('GET');

  const params = new URL(req.url).searchParams;
  const days = dayRange(params);
  if (typeof days === 'string') return json(400, { error: days });

  const slug = params.get('slug');
  if (slug !== null && !LISTEN_SLUGS.has(slug)) return json(400, { error: `unknown slug "${slug}"` });

  const store = counterStore(context, 'strong');
  const keysByDay: string[][] = [];
  try {
    // A few days at a time keeps the number of concurrent list calls modest.
    for (let i = 0; i < days.length; i += 8) {
      const batch = days.slice(i, i + 8);
      const lists = await Promise.all(
        batch.map((day) => store.list({ prefix: slug ? `${day}/${slug}/` : `${day}/` })),
      );
      for (const list of lists) keysByDay.push(list.blobs.map((blob) => blob.key));
    }
  } catch (error) {
    console.error('relay-totals: could not list hits', error instanceof Error ? error.message : error);
    return json(503, { error: 'counter storage unavailable' });
  }

  const totals = emptyCounts();
  const byContent = new Map<string, { utm_content: string | null } & Counts>();
  const byDevice = new Map<string, { device: string } & Counts>();

  const dayReports = days.map((date, index) => {
    const dayCounts = emptyCounts();
    const rows = new Map<string, Row>();
    for (const key of keysByDay[index]) {
      const [, keySlug, event, device, contentSegment] = key.split('/');
      if (!(COUNTER_EVENTS as readonly string[]).includes(event)) continue;
      const counterEvent = event as CounterEvent;
      const content = decodeContent(contentSegment);

      dayCounts[counterEvent] += 1;
      totals[counterEvent] += 1;
      addTo(rows, `${keySlug}/${device}/${contentSegment}`, () => ({ slug: keySlug, utm_content: content, device, ...emptyCounts() }), counterEvent);
      addTo(byContent, contentSegment, () => ({ utm_content: content, ...emptyCounts() }), counterEvent);
      addTo(byDevice, device, () => ({ device, ...emptyCounts() }), counterEvent);
    }
    return { date, ...dayCounts, rows: Array.from(rows.values()).sort(byPageViews) };
  });

  return json(200, {
    store: isProductionDeploy(context) ? 'production' : 'preview',
    timezone: 'UTC',
    from: days[0],
    to: days[days.length - 1],
    slug,
    totals,
    by_content: Array.from(byContent.values()).sort(byPageViews),
    by_device: Array.from(byDevice.values()).sort(byPageViews),
    days: dayReports,
  });
};
