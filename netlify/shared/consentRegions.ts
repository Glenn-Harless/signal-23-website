/**
 * Where listen page visitors must opt in before any Meta measurement: the
 * EU/EEA, the UK and Switzerland (ISO 3166-1 alpha-2, as Netlify geolocation
 * reports them). Everywhere else Meta measurement runs unless the visitor opts
 * out. An unknown country is treated as opt-in.
 *
 * Shared by the listen-region edge function (Deno) and the relay-forward
 * function (Node), so it imports nothing.
 */
const OPT_IN_COUNTRIES = new Set([
  // EU member states
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE',
  'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EU outermost regions and Åland, which geolocation can report separately
  'GF', 'GP', 'MQ', 'RE', 'YT', 'MF', 'AX',
  // Rest of the EEA, the UK (and Gibraltar), Switzerland
  'IS', 'LI', 'NO', 'GB', 'GI', 'CH',
]);

// Placeholder codes geolocation databases use when they can't name a country
// (continent-only, anonymous proxy, satellite, Tor, unknown): treated as unknown.
const UNKNOWN_CODES = new Set(['EU', 'AP', 'XX', 'ZZ', 'A1', 'A2', 'O1', 'T1']);

export type ConsentMode = 'opt-in' | 'opt-out';

export function consentModeForCountry(countryCode: string | null | undefined): ConsentMode {
  const code = (countryCode || '').trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9]$/.test(code) || UNKNOWN_CODES.has(code)) return 'opt-in';
  return OPT_IN_COUNTRIES.has(code) ? 'opt-in' : 'opt-out';
}
