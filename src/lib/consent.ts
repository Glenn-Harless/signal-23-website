/**
 * Tracking-consent seam for the listen landing pages.
 *
 * The site has no consent banner today, so consent is implied unless the
 * visitor has opted out through Global Privacy Control or a stored denial.
 * A future banner only needs to call `setStoredConsent`.
 */

export type ConsentState = 'granted' | 'denied' | 'unset';

export const CONSENT_STORAGE_KEY = 's23.analytics-consent';

export function readStoredConsent(): ConsentState {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : 'unset';
  } catch {
    return 'unset';
  }
}

export function setStoredConsent(state: Exclude<ConsentState, 'unset'>): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, state);
  } catch {
    // Storage unavailable (private mode, blocked cookies): treat as session-only.
  }
}

function hasGlobalPrivacyControl(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

/** True when third-party tracking (Meta Pixel) may run for this visitor. */
export function hasTrackingConsent(): boolean {
  if (typeof window === 'undefined') return false;
  if (hasGlobalPrivacyControl()) return false;
  return readStoredConsent() !== 'denied';
}
