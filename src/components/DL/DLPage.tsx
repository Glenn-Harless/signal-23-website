import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GritText } from '../Station/GritText';
import { localHour, moonLit, moonPhase, skyPhase } from '../Station/sky';
import { analyserFor, resumeAudio } from '../../lib/audioGraph';
import rackData from '../../data/racks.json';
import './dl.css';

type Macro = { n: string; v: number };
type Rack = {
  slug: string;
  name: string;
  pack: string;
  device: boolean;
  macros: Macro[];
  variations: string[];
  devices: string[];
  what: string;
  start: string | null;
  version: string | null;
};
type Pack = { id: string; name: string };

const PACKS = rackData.packs as Pack[];
const RACKS = rackData.racks as Rack[];
const DEVICES = RACKS.filter((r) => r.device);

// Demos for BK Baklengs: a plain synth phrase, then four of its presets answering it.
const BK_DEMOS = [
  { id: 'dry', name: 'DRY PHRASE', len: '0:13', src: '/audio/bk/dry-phrase.mp3' },
  { id: 'p01', name: 'LONG BACK', len: '0:22', src: '/audio/bk/long-back.mp3' },
  { id: 'p02', name: 'GRAIN ANSWER', len: '0:22', src: '/audio/bk/grain-answer.mp3' },
  { id: 'p03', name: 'SPLIT ANSWER', len: '0:22', src: '/audio/bk/split-answer.mp3' },
  { id: 'p05', name: 'HALF-SPEED FLOOR', len: '0:27', src: '/audio/bk/half-speed-floor.mp3' },
];

const pad2 = (n: number) => String(n).padStart(2, '0');
// Each knob at its saved position, 0 to 9, in five-digit groups.
const digitsOf = (macros: Macro[]) => macros.map((m) => String(Math.min(9, Math.round(m.v * 9))));
const grouped = (digits: string[]) => digits.join('').replace(/(.{5})/g, '$1 ').trim();

// Pad rows: devices first, then every pack in folder order.
const PAD = [...DEVICES, ...PACKS.flatMap((p) => RACKS.filter((r) => r.pack === p.id && !r.device))];

type CheckoutState = { pack: string; status: 'loading' | 'ready' | 'error'; message?: string; url?: string };

export const DLPage: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  const [sel, setSel] = useState(PAD[0]?.slug ?? '');
  const [playing, setPlaying] = useState<string | null>(null);
  const [live, setLive] = useState<{ digits: string[]; cursor: number } | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // While a BK demo plays, its line is read out live: each digit follows the energy in one band.
  useEffect(() => {
    const el = audioRef.current;
    const bk = DEVICES[0];
    if (!playing || !el || !bk) {
      setLive(null);
      return undefined;
    }
    const analyser = analyserFor(el, 2048);
    if (!analyser) return undefined;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const m = bk.macros.length;
    let tick = 0;
    const timer = setInterval(() => {
      analyser.getByteFrequencyData(buf);
      const digits: string[] = [];
      for (let j = 0; j < m; j += 1) {
        const lo = Math.floor(2 * 200 ** (j / m));
        const hi = Math.floor(2 * 200 ** ((j + 1) / m));
        let e = 0;
        for (let b = lo; b <= hi; b += 1) e += buf[b];
        e = e / (hi - lo + 1) / 255;
        digits.push(String(Math.min(9, Math.round(e * 12))));
      }
      tick += 1;
      setLive({ digits, cursor: tick % m });
    }, 110);
    return () => clearInterval(timer);
  }, [playing]);

  useEffect(() => () => audioRef.current?.pause(), []);

  const playDemo = (demo: (typeof BK_DEMOS)[number]) => {
    const el = audioRef.current;
    if (!el) return;
    if (playing === demo.id) {
      el.pause();
      setPlaying(null);
      return;
    }
    resumeAudio();
    analyserFor(el, 2048);
    el.src = demo.src;
    el.play().then(() => setPlaying(demo.id)).catch(() => setPlaying(null));
    if (DEVICES[0]) setSel(DEVICES[0].slug);
  };

  const download = useCallback(async (pack: Pack) => {
    const raw = (prices[pack.id] ?? '0').replace(/[^0-9.]/g, '');
    const amount = Math.round((parseFloat(raw) || 0) * 100) / 100;
    if (amount > 0 && amount < 0.5) {
      setCheckout({ pack: pack.id, status: 'error', message: '$0 IS FREE. PAID AMOUNTS START AT $0.50.' });
      return;
    }
    setCheckout({ pack: pack.id, status: 'loading' });
    try {
      if (amount === 0) {
        const res = await fetch('/.netlify/functions/free-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packId: pack.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Download failed');
        setCheckout({ pack: pack.id, status: 'ready', url: data.downloadUrl });
        window.location.href = data.downloadUrl;
      } else {
        const res = await fetch('/.netlify/functions/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packId: pack.id, packTitle: `Signal-23 ${pack.name} Racks`, amount }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Checkout failed');
        window.location.href = data.checkoutUrl;
      }
    } catch (e) {
      setCheckout({ pack: pack.id, status: 'error', message: (e instanceof Error ? e.message : 'Something went wrong').toUpperCase() });
    }
  }, [prices]);

  const selected = PAD.find((r) => r.slug === sel);
  const h = localHour(now);
  let n = 0;

  const rackItem = (r: Rack) => (
    <article
      key={r.slug}
      ref={(el) => {
        itemRefs.current[r.slug] = el;
      }}
      className={`dl-item${sel === r.slug ? ' is-on' : ''}`}
      onMouseEnter={() => setSel(r.slug)}
      onFocus={() => setSel(r.slug)}
    >
      <h3 className="tw ink">
        {r.name.toUpperCase()}
        {r.version ? <span className="dl-ro dl-ver"> {r.version.toUpperCase()}</span> : null}
      </h3>
      <p className="dl-what">{r.what}</p>
      {r.start && <div className="dl-ro dl-start">START: {r.start.toUpperCase()}</div>}
      {r.variations.length > 0 && (
        <>
          <div className="dl-lbl">PRESETS</div>
          <div className="dl-mac">{r.variations.map((v) => v.toUpperCase()).join('  /  ')}</div>
        </>
      )}
      <div className="dl-lbl">KNOBS</div>
      <div className="dl-mac">
        {r.macros.length ? r.macros.map((m) => `${m.n.toUpperCase()} ${Math.min(9, Math.round(m.v * 9))}`).join('  /  ') : 'NONE MAPPED; OPEN THE RACK TO ADJUST IT.'}
      </div>
    </article>
  );

  return (
    <div className="dl-page">
      <svg width="0" height="0" className="dl-defs" aria-hidden="true" focusable="false">
        <filter id="dl-ink" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={23} />
          <feDisplacementMap in="SourceGraphic" scale={1.8} />
        </filter>
        <filter id="dl-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={5} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <svg className="dl-grain" aria-hidden="true">
        <rect width="100%" height="100%" filter="url(#dl-noise)" />
      </svg>
      <audio ref={audioRef} preload="none" onEnded={() => setPlaying(null)} />

      <main className="dl-wrap">
        <div className="dl-ro dl-sky">
          <span>LOCAL {pad2(now.getHours())}:{pad2(now.getMinutes())}</span>
          <span>{skyPhase(h)}</span>
          <span>MOON {Math.round(moonLit(moonPhase(now.getTime())) * 100)}%</span>
        </div>

        <div className="dl-cols">
          <aside className="dl-pin" aria-label="Schedule">
            <div className="dl-pad">
              <div className="dl-padhead">
                <span>S23 / DL / SCHEDULE</span>
                <span>{PAD.length} GROUPS</span>
              </div>
              {PAD.map((r, i) => {
                n += 1;
                const isLive = live && r.device && playing;
                const digits = isLive ? live!.digits : digitsOf(r.macros);
                const newPack = i > 0 && (r.pack !== PAD[i - 1].pack || PAD[i - 1].device !== r.device);
                return (
                  <button
                    type="button"
                    key={r.slug}
                    className={`dl-prow${sel === r.slug ? ' is-on' : ''}${newPack ? ' is-gap' : ''}`}
                    onClick={() => {
                      setSel(r.slug);
                      itemRefs.current[r.slug]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    <span className="dl-pn">{pad2(n)}</span>
                    <span className="dl-pg">
                      {digits.length === 0
                        ? '·····'
                        : digits.map((ch, k) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <React.Fragment key={k}>
                            {k > 0 && k % 5 === 0 ? ' ' : ''}
                            <span className={isLive && k === live!.cursor ? 'dl-cur' : undefined}>{ch}</span>
                          </React.Fragment>
                        ))}
                    </span>
                    <span className="dl-pl">{r.name.toUpperCase()}</span>
                  </button>
                );
              })}
              <div className="dl-padfoot">
                {selected ? `${selected.name.toUpperCase()}  ${selected.macros.length ? grouped(digitsOf(selected.macros)) : ''}` : ''}
              </div>
              <div className="dl-ro dl-key">EACH LINE IS A RACK. EACH DIGIT IS ONE OF ITS KNOBS AT ITS SAVED POSITION, 0 TO 9.</div>
            </div>
          </aside>

          <div className="dl-main">
            <div className="dl-head">
              <h1 className="sr-only">DL</h1>
              <GritText text="DL" id="dl-title" className="dl-title" layers={2} />
              <p className="tw dl-tag">Devices and racks. Pay what you want. $0 is fine.</p>
            </div>

            {DEVICES.length > 0 && (
              <section className="dl-section" aria-labelledby="dl-devices">
                <div className="dl-sh">
                  <h2 id="dl-devices" className="tw ink">
                    DEVICES
                  </h2>
                  <span className="dl-ro">MAX FOR LIVE</span>
                </div>
                {DEVICES.map((d) => (
                  <article
                    key={d.slug}
                    ref={(el) => {
                      itemRefs.current[d.slug] = el;
                    }}
                    className={`dl-item${sel === d.slug ? ' is-on' : ''}`}
                    onMouseEnter={() => setSel(d.slug)}
                  >
                    <div className="dl-lbl">AUDIO EFFECT / IN DEVELOPMENT</div>
                    <h3 className="tw ink dl-device-name">{d.name.toUpperCase()}</h3>
                    <p className="dl-what">
                      Plays what you just played back to you, backwards. Long reverse answers, held reverse beds, octave cascades and glitch.
                    </p>
                    <div className="dl-ro dl-start">START: LONG BACK. PLAY A PHRASE, STOP, HEAR IT ANSWER.</div>
                    <div className="dl-demos">
                      <div className="dl-lbl">LISTEN / A SYNTH PHRASE, THEN FOUR PRESETS</div>
                      {BK_DEMOS.map((demo) => (
                        <button
                          key={demo.id}
                          type="button"
                          className={`dl-demo${playing === demo.id ? ' is-on' : ''}`}
                          aria-pressed={playing === demo.id}
                          onClick={() => playDemo(demo)}
                        >
                          <span className="dl-demo__ic" aria-hidden="true">
                            {playing === demo.id ? '■' : '▶'}
                          </span>
                          <span className="dl-demo__nm">{demo.name}</span>
                          <span className="dl-ro">{demo.len}</span>
                        </button>
                      ))}
                    </div>
                    <div className="dl-lbl">KNOBS / BANK 1 AND BANK 2</div>
                    <div className="dl-mac">
                      {d.macros.slice(0, 8).map((m) => m.n.toUpperCase()).join('  /  ')}
                      <br />
                      {d.macros.slice(8).map((m) => m.n.toUpperCase()).join('  /  ')}
                    </div>
                    <div className="dl-ro">NOT AVAILABLE YET</div>
                  </article>
                ))}
              </section>
            )}

            <section className="dl-section" aria-labelledby="dl-racks">
              <div className="dl-sh">
                <h2 id="dl-racks" className="tw ink">
                  RACKS
                </h2>
                <span className="dl-ro">ABLETON LIVE 12 SUITE / AUDIO EFFECT RACKS</span>
              </div>
              {PACKS.map((p) => {
                const members = RACKS.filter((r) => r.pack === p.id && !r.device);
                if (!members.length) return null;
                const state = checkout && checkout.pack === p.id ? checkout : null;
                return (
                  <div key={p.id} className="dl-pack">
                    <div className="dl-packhead">
                      <h3 className="tw ink">{p.name.toUpperCase()}</h3>
                      <span className="dl-ro">{members.length} RACKS</span>
                    </div>
                    <form
                      className="dl-buy"
                      onSubmit={(e) => {
                        e.preventDefault();
                        download(p);
                      }}
                    >
                      <label className="dl-price">
                        <span aria-hidden="true">$</span>
                        <input
                          value={prices[p.id] ?? '0.00'}
                          onChange={(e) => setPrices((prev) => ({ ...prev, [p.id]: e.target.value.replace(/[^0-9.]/g, '') }))}
                          inputMode="decimal"
                          aria-label={`Price for the ${p.name} pack, in US dollars`}
                        />
                      </label>
                      <button type="submit" className="dl-dlb tw" disabled={state?.status === 'loading'}>
                        <span>{state?.status === 'loading' ? 'OPENING...' : 'DOWNLOAD PACK'}</span>
                      </button>
                      {state?.status === 'error' && <span className="dl-err">{state.message}</span>}
                      {state?.status === 'ready' && state.url && (
                        <a className="dl-ro" href={state.url}>
                          DOWNLOAD STARTED. LINK LASTS 30 MINUTES.
                        </a>
                      )}
                    </form>
                    {members.map(rackItem)}
                  </div>
                );
              })}
              <div className="dl-ro">$0 IS FREE. $0.50 AND UP GOES THROUGH STRIPE.</div>
            </section>

            <footer className="dl-foot">
              <a href="mailto:music@signal23.net">music@signal23.net</a>
              <span className="dl-ro">
                <Link to="/terms">TERMS</Link>  /  <Link to="/legal/privacy">PRIVACY</Link>
              </span>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
};
