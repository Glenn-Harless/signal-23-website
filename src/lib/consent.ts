/**
 * Tracking consent for the listen landing pages.
 *
 * Opt-in: Meta measurement runs only after the visitor taps Accept on the
 * listen page banner. No stored choice means no, and Global Privacy Control
 * means no whatever is stored. Our own cookie-free counter does not depend on
 * this.
 */

export type ConsentState = 'granted' | 'denied' | 'unset';

export const CONSENT_STORAGE_KEY = 's23.analytics-consent';

// Fallback when storage is unavailable (private mode, blocked site data): the choice lasts for this page.
let sessionChoice: ConsentState = 'unset';

export function readStoredConsent(): ConsentState {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : sessionChoice;
  } catch {
    return sessionChoice;
  }
}

export function setStoredConsent(state: Exclude<ConsentState, 'unset'>): void {
  sessionChoice = state;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, state);
  } catch {
    // Storage unavailable: `sessionChoice` keeps the answer until the page unloads.
  }
}

export function hasGlobalPrivacyControl(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

/** True when third-party tracking (Meta Pixel, Conversions API) may run for this visitor. */
export function hasTrackingConsent(): boolean {
  if (typeof window === 'undefined') return false;
  if (hasGlobalPrivacyControl()) return false;
  return readStoredConsent() === 'granted';
}
