import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { audioStreamer } from './AudioStreamer';
import { RELEASES, Release, formatDuration, telemetryFor } from '../../data/releases';
import { STATION_ROUTES, decodeGroup, markRecovered, readRecovered, StationRoute } from '../../data/numberStation';
import { localHour, moonLit, moonPhase, skyPhase } from '../Station/sky';
import { analyserFor, resumeAudio } from '../../lib/audioGraph';
import './stationTerminal.css';

type Mode = 'boot' | 'log' | 'tune' | 'decode' | 'scan' | 'archives' | 'broadcast';
type LineKind = 'system' | 'warning' | 'separator' | 'dim' | 'bright';
type Line = { kind: LineKind; text: string };

const BOOT: Line[] = [
  { kind: 'separator', text: '█ █ █ █ █ █ █ █ █ █ █ █ █ █ ' },
  { kind: 'system', text: 'ENCRYPTION ESTABLISHED, CONNECTION SECURE' },
  { kind: 'separator', text: '...........................' },
  { kind: 'system', text: 'PROPRIETARY BROADCAST ACTIVITY NETWORKED INFORMATION SYSTEM TERMINAL' },
  { kind: 'separator', text: '---------------------------' },
  { kind: 'system', text: 'FOR USE ON DESIGNATED INFORMATION SYSTEMS ONLY' },
  { kind: 'system', text: 'AUTHORIZED USE ONLY' },
  { kind: 'system', text: 'UNAUTHORIZED RECORDING OR DISTRIBUTION OF MATERIAL IS UNLAWFUL' },
  { kind: 'separator', text: '---------------------------' },
  { kind: 'warning', text: 'PHYSICAL ACCESS KEY NOT DETECTED' },
  { kind: 'warning', text: 'OPERATOR CREDENTIALS NOT FOUND' },
  { kind: 'warning', text: 'SOME PERMISSIONS RESTRICTED' },
  { kind: 'separator', text: '............................' },
];

const ARCHIVE_LINKS = [
  { name: 'YOUTUBE', url: 'https://youtube.com/@signal-23-music' },
  { name: 'SPOTIFY', url: 'https://open.spotify.com/artist/3ZKXfUCXvaZbEdCRx9sWD6' },
  { name: 'SOUNDCLOUD', url: 'https://soundcloud.com/signal-23' },
  { name: 'BANDCAMP', url: 'https://signal-23.bandcamp.com/' },
  { name: 'INSTAGRAM', url: 'https://www.instagram.com/signal23music/' },
];

const KEYS: Array<[string, Mode]> = [
  ['LOG', 'log'],
  ['TUNE', 'tune'],
  ['DECODE', 'decode'],
  ['SCAN', 'scan'],
  ['ARCHIVES', 'archives'],
  ['CLEAR', 'boot'],
];

const INTRO_KEY = 'terminal-intro-seen';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const GLITCH = ['█', '▓', '▒', '░', '$', '&', '#', '@'];

const pad2 = (n: number) => String(n).padStart(2, '0');

const dialFor = (selected: Release, cols: number) => {
  const per = cols / 12;
  let top = '';
  for (let m = 0; m < 12; m += 1) {
    const label = pad2(m + 1);
    top += label + ' '.repeat(Math.max(0, per - label.length));
  }
  const marks: string[] = Array.from({ length: cols }, (_, q) => (q % per === 0 ? '|' : '.'));
  const colOf = (r: Release) => {
    const [, mm, dd] = r.date.split('.').map(Number);
    return Math.min(cols - 1, Math.round(((mm - 1 + (dd - 1) / 31) / 12) * cols));
  };
  RELEASES.forEach((r) => {
    marks[colOf(r)] = '+';
  });
  marks[colOf(selected)] = '█';
  return [top, marks.join('')];
};

interface StationTerminalProps {
  isMobile: boolean;
}

export const StationTerminal: React.FC<StationTerminalProps> = ({ isMobile }) => {
  const navigate = useNavigate();
  // /terminal?tune=09.25 opens straight onto a release (A/V links here).
  const tuneParam = new URLSearchParams(window.location.search).get('tune');
  const tuneIndex = tuneParam ? RELEASES.findIndex((r) => r.freq === tuneParam) : -1;
  const [mode, setMode] = useState<Mode>(tuneIndex >= 0 ? 'tune' : 'boot');
  const [bootLines, setBootLines] = useState<Line[]>([]);
  const [booted, setBooted] = useState(false);
  const [sel, setSel] = useState(tuneIndex >= 0 ? tuneIndex : RELEASES.length - 1);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [cmd, setCmd] = useState('');
  const [lastCmd, setLastCmd] = useState('');
  const [code, setCode] = useState('');
  const [decoded, setDecoded] = useState<{ group: string; route: StationRoute | null } | null>(null);
  const [recovered, setRecovered] = useState<string[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [dialCols, setDialCols] = useState(48);

  const release = RELEASES[sel];
  const tele = telemetryFor(release.slug);

  useEffect(() => {
    setRecovered(readRecovered());
    const timer = setInterval(() => {
      setNow(new Date());
      if (audioRef.current) setPos(audioRef.current.currentTime);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // The year dial is as many characters wide as the screen allows, in whole months.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      const charW = isMobile ? 6.02 : 8.43;
      setDialCols(Math.max(36, Math.floor(el.clientWidth / charW / 12) * 12));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile]);

  // Boot: typed in on the first visit of a session, shown at once after that.
  useEffect(() => {
    let cancelled = false;
    const seen = (() => {
      try {
        return window.sessionStorage.getItem(INTRO_KEY) === 'true';
      } catch {
        return false;
      }
    })();
    if (seen) {
      setBootLines(BOOT);
      setBooted(true);
      return undefined;
    }
    (async () => {
      const shown: Line[] = [];
      for (const line of BOOT) {
        if (cancelled) return;
        shown.push({ kind: line.kind, text: '' });
        const idx = shown.length - 1;
        const delay = line.kind === 'warning' ? 15 : line.kind === 'separator' ? 5 : 3;
        for (let i = 0; i <= line.text.length; i += 1) {
          if (cancelled) return;
          // eslint-disable-next-line no-await-in-loop
          await wait(line.kind === 'warning' ? Math.random() * delay * 2 : delay);
          const partial = line.text.slice(0, i);
          const glitch = line.kind === 'warning' && Math.random() < 0.1 && i < line.text.length;
          shown[idx] = { kind: line.kind, text: glitch ? partial + GLITCH[Math.floor(Math.random() * GLITCH.length)] : partial };
          setBootLines([...shown]);
        }
        // eslint-disable-next-line no-await-in-loop
        await wait(line.kind === 'warning' ? 150 : line.kind === 'separator' ? 100 : 50);
      }
      if (cancelled) return;
      setBooted(true);
      try {
        window.sessionStorage.setItem(INTRO_KEY, 'true');
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stopTrack = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const stopScan = useCallback(() => {
    audioStreamer.stop();
  }, []);

  const go = useCallback(
    (next: Mode) => {
      if (next !== 'tune') stopTrack();
      if (next !== 'scan') stopScan();
      if (next === 'scan' && mode === 'scan') {
        setMode('boot');
        return;
      }
      setMode(next);
    },
    [mode, stopScan, stopTrack],
  );

  // SCAN tunes into a random stretch of the station's own stream.
  useEffect(() => {
    if (mode !== 'scan') return undefined;
    setScanError(null);
    audioStreamer
      .playRandomSegment({ onError: (e) => setScanError(e.message) })
      .catch((e: Error) => setScanError(e.message));
    return () => audioStreamer.stop();
  }, [mode]);

  useEffect(() => () => {
    audioStreamer.stop();
  }, []);

  const select = useCallback(
    (i: number) => {
      if (i !== sel) stopTrack();
      setSel((i + RELEASES.length) % RELEASES.length);
      setMode('tune');
    },
    [sel, stopTrack],
  );

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el || !release.audio) return;
    if (playing) {
      stopTrack();
      return;
    }
    resumeAudio();
    analyserFor(el, 2048);
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };

  const runDecode = (group = code) => {
    const route = decodeGroup(group);
    if (route) setRecovered(markRecovered(route.slug));
    setDecoded({ group, route });
  };

  const run = (raw: string) => {
    const s = raw.trim().toUpperCase();
    if (!s) return;
    setLastCmd(s);
    setCmd('');
    const [c, arg] = s.split(/\s+/);
    if (c === 'TUNE' && arg) {
      const i = RELEASES.findIndex((r) => r.freq === arg || r.freq.startsWith(arg));
      if (i >= 0) select(i);
      else go('tune');
    } else if (c === 'DECODE' && arg) {
      const g = arg.replace(/\D/g, '').slice(0, 5);
      setCode(g);
      go('decode');
      runDecode(g);
    } else if (c === 'EXIT') {
      stopTrack();
      stopScan();
      navigate('/');
    } else if (c === 'CLEAR' || c === 'COMMANDS') {
      go('boot');
    } else if (c === 'BROADCAST') {
      go('broadcast');
    } else if (['LOG', 'TUNE', 'DECODE', 'SCAN', 'ARCHIVES'].includes(c)) {
      go(c.toLowerCase() as Mode);
    }
  };

  // Plot: the release's measured spectrum as stacked ridgelines, or a live waterfall while it plays or scans.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || (mode !== 'tune' && mode !== 'scan')) return undefined;
    const ctx = cv.getContext('2d');
    if (!ctx) return undefined;
    const W = Math.max(1, cv.clientWidth);
    const H = Math.max(1, cv.clientHeight);
    cv.width = W;
    cv.height = H;
    ctx.fillStyle = '#000b00';
    ctx.fillRect(0, 0, W, H);

    const live = mode === 'scan' || (playing && !!audioRef.current);
    if (!live) {
      if (!tele) {
        for (let s = 0; s < (W * H) / 25; s += 1) {
          ctx.fillStyle = `rgba(74,222,128,${(Math.random() * 0.35).toFixed(2)})`;
          ctx.fillRect(Math.random() * W, Math.random() * H, 2, 1);
        }
        ctx.fillStyle = '#4ade80';
        ctx.font = '14px IBM Plex Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(release.audio ? 'NOT MEASURED YET' : 'NO MASTER ON FILE', W / 2, H / 2 + 4);
        return undefined;
      }
      let raf = 0;
      let last = 0;
      const rows = tele.spectrum;
      const draw = (ts: number) => {
        raf = requestAnimationFrame(draw);
        if (ts - last < 120) return;
        last = ts;
        const cur = Math.floor((ts / 500) % rows.length);
        ctx.fillStyle = '#000b00';
        ctx.fillRect(0, 0, W, H);
        rows.forEach((row, r) => {
          const base = 30 + r * ((H - 36) / rows.length);
          ctx.beginPath();
          ctx.moveTo(0, base);
          row.forEach((v, b) => ctx.lineTo((b / (row.length - 1)) * W, base - v * (H / 470)));
          ctx.lineTo(W, base);
          ctx.closePath();
          ctx.fillStyle = '#000b00';
          ctx.fill();
          ctx.strokeStyle = r === cur ? '#b8ffcf' : 'rgba(74,222,128,0.75)';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      };
      raf = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(raf);
    }

    const el = audioRef.current;
    const analyser = mode === 'tune' && el ? analyserFor(el, 2048) : null;
    const buf = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    let raf = 0;
    let last = 0;
    const cols = 150;
    const cw = W / cols;
    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw);
      if (ts - last < 33) return;
      last = ts;
      ctx.drawImage(cv, 0, 0, W, H - 3, 0, 3, W, H - 3);
      ctx.fillStyle = '#000b00';
      ctx.fillRect(0, 0, W, 3);
      let bins: ArrayLike<number> | null = null;
      if (analyser && buf) {
        analyser.getByteFrequencyData(buf);
        bins = buf;
      } else if (mode === 'scan') {
        bins = audioStreamer.getFrequencyData();
      }
      for (let k = 0; k < cols; k += 1) {
        let a: number;
        if (bins && bins.length) {
          const idx = Math.floor(2 ** ((k / cols) * Math.log2(bins.length * 0.5)));
          a = (bins[Math.min(idx, bins.length - 1)] ?? 0) / 255;
        } else {
          a = Math.random() < 0.06 ? Math.random() : Math.random() * 0.25 * (0.6 + 0.4 * Math.sin(k * 0.3 + ts / 500));
        }
        ctx.fillStyle = `rgba(74,222,128,${(a * a * 1.1).toFixed(3)})`;
        ctx.fillRect(k * cw, 0, cw - 1, 3);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [mode, playing, release, tele]);

  const h = localHour(now);
  const phase = skyPhase(h);
  const moon = Math.round(moonLit(moonPhase(now.getTime())) * 100);
  const clock = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  const today = `${pad2(now.getMonth() + 1)}.${pad2(now.getDate())}`;
  const [dialTop, dialMarks] = useMemo(() => dialFor(release, dialCols), [release, dialCols]);

  const logLines = [
    { d: '11.28', t: 'CARRIER ESTABLISHED. FIRST TRANSMISSION: PIECES.' },
    { d: '01.02', t: 'PILLARS RECEIVED.' },
    { d: '02.06', t: 'RESET RECEIVED.' },
    { d: '03.20', t: `DECAY RECEIVED. LOUDEST MEASURED SO FAR, ${telemetryFor('decay')?.lufs.toFixed(1)} LUFS.` },
    { d: '04.13', t: 'FIVE TRANSMISSIONS BOUND AS ONE: PILLARS EP.' },
    { d: '08.28', t: 'FOUR CHANNELS OPEN ON ONE DAY. EP2.' },
    { d: '09.25', t: 'BROODING GAMES RECEIVED.' },
    { d: today, t: 'LICHEN ON THE FEED HORN AGAIN. LEFT IT.' },
    { d: today, t: `LOCAL SKY ${phase}. MOON ${moon}%. CARRIER STEADY.` },
  ];

  const teleLine = tele
    ? `DUR ${formatDuration(tele.dur)}   LOUD ${tele.lufs.toFixed(1)} LUFS   RANGE ${tele.lra.toFixed(1)} LU   PEAK ${tele.tp.toFixed(1)} dBTP   CENTROID ${tele.centroid} HZ${tele.key ? `   KEY ${tele.key.toUpperCase()}` : ''}`
    : 'NOT MEASURED YET.';

  return (
    <div
      className="station-terminal"
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'c') {
          stopTrack();
          if (mode === 'scan') go('boot');
        }
      }}
      onClick={(e) => {
        if (!isMobile && (e.target as HTMLElement).classList.contains('station-terminal__screen')) inputRef.current?.focus();
      }}
    >
      <audio
        ref={audioRef}
        src={release.audio}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
      <div className="station-terminal__screen">
        <div className="st-dim st-header">
          <span>B.A.N.I.S. TERMINAL</span>
          <span>
            LOCAL {clock}  {phase}  CARRIER 23
          </span>
        </div>

        <div ref={bodyRef} className="station-terminal__body">
          {mode === 'boot' && (
            <div className="st-glow">
              {bootLines.map((l, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i} className={`st-${l.kind}`}>
                  {l.text}
                </div>
              ))}
              {booted && (
                <>
                  <div className="st-bright">
                    LOCAL SKY {phase}. MOON {moon}%. CARRIER STEADY.
                  </div>
                  <div className="st-dim">COMMANDS: LOG  TUNE  DECODE  SCAN  ARCHIVES  CLEAR</div>
                </>
              )}
            </div>
          )}

          {mode === 'log' && (
            <div className="st-glow">
              <div className="st-bright">&gt; LOG</div>
              <div className="st-dim">FIELD LOG, STATION 23</div>
              <div className="st-gap" />
              {logLines.map((l, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i} className="st-log-row">
                  <span className="st-dim">{l.d}</span>
                  <span>{l.t}</span>
                </div>
              ))}
            </div>
          )}

          {mode === 'tune' && (
            <div className="st-tune">
              <div className="st-bright st-glow">&gt; TUNE {release.freq}</div>
              <div className="st-row st-glow">
                <span>
                  RECEIVING  <span className="st-bright">{release.title.toUpperCase()}</span>
                </span>
                <span className="st-dim">TRANSMITTED {release.date}</span>
              </div>
              <div className="st-dim st-pre">{teleLine}</div>
              <div className="st-dial">
                <div className="st-dim">{dialTop}</div>
                <div>{dialMarks}</div>
              </div>
              <canvas ref={canvasRef} className="st-plot" aria-hidden="true" />
              <div className="st-controls">
                {release.audio ? (
                  <>
                    <button type="button" className="st-cmd" onClick={togglePlay}>
                      {playing ? 'STOP' : 'PLAY'}
                    </button>
                    <span className="st-dim">
                      {formatDuration(pos)} / {tele ? formatDuration(tele.dur) : '0:00'}
                    </span>
                  </>
                ) : (
                  <span className="st-dim">SOURCE NOT LOADED</span>
                )}
              </div>
              <div className="st-channels">
                {RELEASES.map((r, i) => (
                  <button key={r.slug} type="button" className={`st-channel${i === sel ? ' is-on' : ''}`} onClick={() => select(i)}>
                    <span className="st-channel__freq">{r.freq}</span>
                    <span>{r.title.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'decode' && (
            <div className="st-glow">
              <div className="st-bright">&gt; DECODE</div>
              <form
                className="st-decode"
                onSubmit={(e) => {
                  e.preventDefault();
                  runDecode();
                }}
              >
                <label htmlFor="st-group" className="st-dim">
                  GROUP
                </label>
                <input
                  id="st-group"
                  className="st-input st-input--group"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  inputMode="numeric"
                  maxLength={5}
                  autoComplete="off"
                />
                <button type="submit" className="st-cmd">
                  DECODE
                </button>
              </form>
              {decoded && decoded.route && (
                <>
                  <button type="button" className="st-link st-bright" onClick={() => navigate(decoded.route!.route)}>
                    ROUTE {pad2(decoded.route.number)} OF 23: {decoded.route.title}
                  </button>
                  <div className="st-bright">RECOVERED.</div>
                </>
              )}
              {decoded && !decoded.route && <div className="st-warning">NO MATCH.</div>}
              <div className="st-gap" />
              <div className="st-dim">
                RECOVERED {recovered.filter((s) => STATION_ROUTES.some((r) => r.slug === s)).length} OF 23
              </div>
            </div>
          )}

          {mode === 'scan' && (
            <div className="st-glow">
              <div className="st-bright">&gt; SCAN</div>
              <div>SCAN&gt;STATIONS&gt;ALL&gt;FREQ&gt;ALL</div>
              <div className="st-dim">{now.toISOString().slice(11, 19)}Z</div>
              <div>{scanError ? `TRANSMISSION ERROR: ${scanError.toUpperCase()}` : 'SCANNING...'}</div>
              <canvas ref={canvasRef} className="st-plot st-plot--scan" aria-hidden="true" />
              <div className="st-dim">{isMobile ? 'PRESS SCAN TO STOP' : '[CTRL+C TO TERMINATE]'}</div>
            </div>
          )}

          {mode === 'archives' && (
            <div className="st-glow">
              <div className="st-bright">&gt; ARCHIVES</div>
              <div>SEARCHING ARCHIVES...</div>
              <div>VERIFYING PERMISSIONS...</div>
              <div className="st-gap" />
              {ARCHIVE_LINKS.map((l) => (
                <div key={l.name}>
                  <a className="st-a" href={l.url} target="_blank" rel="noreferrer">
                    {l.name}
                  </a>
                </div>
              ))}
            </div>
          )}

          {mode === 'broadcast' && (
            <div className="st-glow">
              <div className="st-bright">&gt; BROADCAST</div>
              <div className="st-warning">PHYSICAL ACCESS KEY NOT DETECTED</div>
              <div className="st-warning">OPERATOR CREDENTIALS NOT FOUND</div>
              <div className="st-warning">SOME PERMISSIONS RESTRICTED</div>
              <div className="st-separator">---------------------------</div>
              <div>AUX RELAY UNLOCKED: DECAY SIGNAL</div>
              <a className="st-a" href="https://distrokid.com/hyperfollow/signal23/decay" target="_blank" rel="noreferrer">
                HYPERFOLLOW // DECAY
              </a>
            </div>
          )}
        </div>

        {!isMobile && (
          <div className="station-terminal__foot">
            <div className="st-keys">
              {KEYS.map(([label, m]) => (
                <button key={label} type="button" className={`st-key${mode === m && m !== 'boot' ? ' is-on' : ''}`} onClick={() => go(m)}>
                  [ {label} ]
                </button>
              ))}
            </div>
            <form
              className="st-prompt"
              onSubmit={(e) => {
                e.preventDefault();
                run(cmd);
              }}
            >
              <label htmlFor="st-cmd">&gt;</label>
              <input
                id="st-cmd"
                ref={inputRef}
                className="st-input"
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' && lastCmd) {
                    e.preventDefault();
                    setCmd(lastCmd);
                  }
                }}
                autoComplete="off"
                spellCheck={false}
                placeholder="TYPE A COMMAND"
              />
            </form>
          </div>
        )}
      </div>

      {isMobile && (
        <div className="station-terminal__tray">
          {[...KEYS.slice(0, 5), ['EXIT', 'boot'] as [string, Mode]].map(([label, m]) => (
            <button
              key={label}
              type="button"
              className={`st-tray-btn${mode === m && label !== 'EXIT' ? ' is-on' : ''}`}
              onClick={() => (label === 'EXIT' ? run('EXIT') : go(m))}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="terminal-noise" aria-hidden="true" />
      <div className="station-terminal__vignette" aria-hidden="true" />
      <div className="terminal-scanlines" aria-hidden="true" />
    </div>
  );
};

export default StationTerminal;
