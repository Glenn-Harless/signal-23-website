import React, { useEffect, useRef, useState } from 'react';
import { ConsentState, hasGlobalPrivacyControl, readStoredConsent } from '../../lib/consent';
import { metaMeasurementConfigured, updateListenConsent } from '../../lib/listenAnalytics';

export type ListenConsent = {
  /** False when there is nothing to ask: no Pixel in this build, or Global Privacy Control is on. */
  askable: boolean;
  choice: ConsentState;
  open: boolean;
  /** True once the visitor has reopened the banner from the page footer. */
  reopened: boolean;
  reopen: () => void;
  choose: (state: Exclude<ConsentState, 'unset'>) => void;
};

/** Banner state: open on the first visit, then closed until the visitor reopens it from the page footer. */
export function useListenConsent(): ListenConsent {
  const [askable] = useState(() => metaMeasurementConfigured() && !hasGlobalPrivacyControl());
  const [choice, setChoice] = useState<ConsentState>(() => readStoredConsent());
  const [open, setOpen] = useState(() => askable && readStoredConsent() === 'unset');
  const [reopened, setReopened] = useState(false);

  return {
    askable,
    choice,
    open,
    reopened,
    reopen: () => {
      setReopened(true);
      setOpen(true);
    },
    choose: (state) => {
      updateListenConsent(state);
      setChoice(state);
      setOpen(false);
    },
  };
}

type ConsentBannerProps = {
  choice: ConsentState;
  onChoose: (state: Exclude<ConsentState, 'unset'>) => void;
  /** Reopened from the footer: take focus so keyboard and screen reader users land on it. */
  focusOnMount: boolean;
};

/*
 * Sits in the page flow under the Spotify button, never over it. Accept and
 * Decline share one style so neither is the easy option.
 */
export const ConsentBanner: React.FC<ConsentBannerProps> = ({ choice, onChoose, focusOnMount }) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focusOnMount && ref.current) ref.current.focus();
  }, [focusOnMount]);

  return (
    <section ref={ref} className="listen__consent" aria-label="Cookie choice" tabIndex={-1}>
      <p className="listen__consent-text">
        Let Meta measure this visit? Accepting loads Meta&rsquo;s Pixel, which sets cookies and tells Meta you saw
        this page and tapped Spotify. Spotify plays either way.{' '}
        <a href="/legal/privacy/#listen-pages">Privacy policy</a>
      </p>
      {choice !== 'unset' ? (
        <p className="listen__consent-current">You {choice === 'granted' ? 'accepted' : 'declined'}.</p>
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
