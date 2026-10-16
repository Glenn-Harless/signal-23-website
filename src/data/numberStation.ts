// Station 23's number groups.
//
// Each of the 23 soft-secret visuals is a route, numbered in registry order. Its plain group is
// "0" + the two-digit route + "23" (route 11 -> 01123). The broadcast group adds the key 20260
// (Decay's release date, 2026.03.20) digit by digit, mod 10, so route 11 is sent as 21383.
// The terminal's DECODE reverses that. Nothing on the site explains it.

import { transmissions } from './transmissions';

export const STATION_KEY = '20260';

export type StationRoute = {
  number: number;
  slug: string;
  title: string;
  route: string;
  group: string;
};

const addKey = (plain: string) =>
  plain
    .split('')
    .map((d, i) => String((Number(d) + Number(STATION_KEY[i])) % 10))
    .join('');

export const subtractKey = (group: string) =>
  group
    .split('')
    .map((d, i) => String((Number(d) - Number(STATION_KEY[i]) + 10) % 10))
    .join('');

export const STATION_ROUTES: StationRoute[] = transmissions
  .filter((t) => t.visibility === 'soft-secret' && t.type === 'visual')
  .slice(0, 23)
  .map((t, i) => {
    const number = i + 1;
    const plain = `0${String(number).padStart(2, '0')}23`;
    return { number, slug: t.slug, title: t.title.toUpperCase(), route: t.route, group: addKey(plain) };
  });

export const decodeGroup = (group: string): StationRoute | null => {
  if (!/^\d{5}$/.test(group)) return null;
  return STATION_ROUTES.find((r) => r.group === group) ?? null;
};

// Recovered routes are remembered in the visitor's own browser only.
const RECOVERED_KEY = 'signal23.recovered';

export const readRecovered = (): string[] => {
  try {
    const raw = window.localStorage.getItem(RECOVERED_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
};

export const markRecovered = (slug: string) => {
  const list = readRecovered();
  if (list.includes(slug)) return list;
  const next = [...list, slug];
  try {
    window.localStorage.setItem(RECOVERED_KEY, JSON.stringify(next));
  } catch {
    // Storage can be blocked; the decode still shows, it just isn't remembered.
  }
  return next;
};

// Deterministic per-day schedule: one real group sent twice among filler, and a different real
// group in the call-up at 23 minutes past the hour.
const dayNumber = (date: Date) => Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);

const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export const scheduleFor = (date = new Date()) => {
  const day = dayNumber(date);
  const today = STATION_ROUTES[(day * 7) % STATION_ROUTES.length];
  const callup = STATION_ROUTES[(day * 7 + 11) % STATION_ROUTES.length];
  const rand = rng(day * 2654435761);
  const real = new Set(STATION_ROUTES.map((r) => r.group));
  const filler: string[] = [];
  while (filler.length < 8) {
    const g = String(Math.floor(rand() * 100000)).padStart(5, '0');
    if (!real.has(g) && !filler.includes(g)) filler.push(g);
  }
  const pool = [...filler.slice(0, 2), today.group, ...filler.slice(2, 6), today.group, ...filler.slice(6)];
  return { pool, callup: ['23', '23', '23', callup.group], today, callupRoute: callup };
};

export const isRealGroup = (group: string) => STATION_ROUTES.some((r) => r.group === group);

// Flash timing for the light: a digit is that many short flashes, a zero is one long one.
export type FlashSequence = { flashes: Array<[number, number]>; digitStarts: number[]; end: number; total: number };

export const flashSequence = (group: string): FlashSequence => {
  const flashes: Array<[number, number]> = [];
  const digitStarts: number[] = [];
  let t = 0;
  group.split('').forEach((ch, i) => {
    const n = Number(ch);
    digitStarts.push(t);
    if (n === 0) {
      flashes.push([t, t + 0.8]);
      t += 1.05;
    } else {
      for (let j = 0; j < n; j += 1) {
        flashes.push([t, t + 0.2]);
        t += 0.45;
      }
    }
    if (i < group.length - 1) t += 0.85;
  });
  return { flashes, digitStarts, end: t, total: t + 2.2 };
};
