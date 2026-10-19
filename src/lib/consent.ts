/**
 * Tracking consent for the listen landing pages, by region.
 *
 * - opt-in (EU/EEA, UK, Switzerland, unknown country): Meta measurement runs
 *   only after the visitor taps Accept on the banner. No stored choice means no.
 * - opt-out (everywhere else): Meta measurement runs unless the visitor
 *   declined or their browser sends Global Privacy Control.
 *
 * The listen-region edge function writes the mode into the page; anything
 * that can't tell (local dev, the SPA fallback) stays opt-in. GPC always means
 * no. Our own cookie-free counter does not depend on this.
 */

export type ConsentState = 'granted' | 'denied' | 'unset';
export type ConsentMode = 'opt-in' | 'opt-out';

export const CONSENT_STORAGE_KEY = 's23.analytics-consent';

let mode: ConsentMode = 'opt-in';

// Fallback when storage is unavailable (private mode, blocked site data): the choice lasts for this page.
let sessionChoice: ConsentState = 'unset';

export function setConsentMode(next: ConsentMode): void {
  mode = next;
}

export function getConsentMode(): ConsentMode {
  return mode;
}

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
  const stored = readStoredConsent();
  if (stored !== 'unset') return stored === 'granted';
  return mode === 'opt-out';
}
