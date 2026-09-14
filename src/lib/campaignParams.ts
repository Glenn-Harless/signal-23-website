/**
 * Allowlisted campaign identifiers carried from the ad click into analytics events.
 * Anything not on this list (fbclid, gclid, arbitrary query keys) is dropped.
 */
export const CAMPAIGN_PARAM_ALLOWLIST = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export type CampaignParamKey = (typeof CAMPAIGN_PARAM_ALLOWLIST)[number];
export type CampaignParams = Partial<Record<CampaignParamKey, string>>;

const MAX_VALUE_LENGTH = 120;

function stripControlCharacters(value: string): string {
  let out = '';
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (code >= 32 && code !== 127) out += ch;
  }
  return out;
}

export function readCampaignParams(search: string): CampaignParams {
  const params: CampaignParams = {};
  try {
    const query = new URLSearchParams(search);
    for (const key of CAMPAIGN_PARAM_ALLOWLIST) {
      const raw = query.get(key);
      if (!raw) continue;
      const clean = stripControlCharacters(raw).trim().slice(0, MAX_VALUE_LENGTH);
      if (clean) params[key] = clean;
    }
  } catch {
    // Malformed query strings never break the page.
  }
  return params;
}
