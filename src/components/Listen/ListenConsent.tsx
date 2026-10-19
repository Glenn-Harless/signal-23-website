import React, { useEffect, useRef, useState } from 'react';
import { getConsentMode, hasGlobalPrivacyControl, hasTrackingConsent, readStoredConsent } from '../../lib/consent';
import { metaMeasurementConfigured, updateListenConsent } from '../../lib/listenAnalytics';

export type ListenConsent = {
  /** False when there is nothing to ask: no Pixel in this build, or Global Privacy Control is on. */
  askable: boolean;
  /** Whether Meta measurement is currently allowed for this visitor. */
  measuring: boolean;
  open: boolean;
  /** True once the visitor has reopened the banner from the page footer. */
  reopened: boolean;
  reopen: () => void;
  choose: (state: 'granted' | 'denied') => void;
};

/**
 * Banner state. In opt-in regions it opens on the first visit; elsewhere it
 * stays closed and the footer's Cookies link lets visitors opt out.
 */
export function useListenConsent(): ListenConsent {
  const [askable] = useState(() => metaMeasurementConfigured() && !hasGlobalPrivacyControl());
  const [measuring, setMeasuring] = useState(() => hasTrackingConsent());
  const [open, setOpen] = useState(() => askable && getConsentMode() === 'opt-in' && readStoredConsent() === 'unset');
  const [reopened, setReopened] = useState(false);

  return {
    askable,
    measuring,
    open,
    reopened,
    reopen: () => {
      setReopened(true);
      setOpen(true);
    },
    choose: (state) => {
      updateListenConsent(state);
      setMeasuring(state === 'granted');
      setOpen(false);
    },
  };
}

type ConsentBannerProps = {
  measuring: boolean;
  onChoose: (state: 'granted' | 'denied') => void;
  /** Reopened from the footer: take focus and say whether measurement is on. */
  reopened: boolean;
};

/*
 * Sits in the page flow under the Spotify button, never over it. Accept and
 * Decline share one style so neither is the easy option.
 */
export const ConsentBanner: React.FC<ConsentBannerProps> = ({ measuring, onChoose, reopened }) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reopened && ref.current) ref.current.focus();
  }, [reopened]);

  return (
    <section ref={ref} className="listen__consent" aria-label="Cookie choice" tabIndex={-1}>
      <p className="listen__consent-text">
        Let Meta measure this visit? Accepting loads Meta&rsquo;s Pixel, which sets cookies and tells Meta you saw
        this page and tapped Spotify. Spotify plays either way.{' '}
        <a href="/legal/privacy/#listen-pages">Privacy policy</a>
      </p>
      {reopened ? (
        <p className="listen__consent-current">Meta measurement is {measuring ? 'on' : 'off'}.</p>
      ) : null}
      <div className="listen__consent-actions">
        <button type="button" onClick={() => onChoose('granted')}>
          Accept
        </button>
        <button type="button" onClick={() => onChoose('denied')}>
          Decline
        </button>
      </div>
    </section>
  );
};
