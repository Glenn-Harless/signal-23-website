import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SpectrumWindow } from './SpectrumWindow';
import { GritText } from '../Station/GritText';
import { LOOSE_EXCERPTS, RELEASES, Release, formatDuration, latestRelease, telemetryFor } from '../../data/releases';
import { localHour, moonLit, moonPhase, skyPalette, skyPhase } from '../Station/sky';
import './av.css';

const SPOTIFY = 'https://open.spotify.com/artist/3ZKXfUCXvaZbEdCRx9sWD6';

const pad2 = (n: number) => String(n).padStart(2, '0');
const tuneLink = (r: Release) => `/terminal?tune=${r.freq}`;

// A still from our own server; YouTube only loads once the visitor presses play. YouTube can refuse
// to play inside other sites for visitors it doesn't recognise, so a direct link appears as well.
const YouTubeFrame: React.FC<{ id: string; title: string; poster: string; vertical?: boolean }> = ({ id, title, poster, vertical }) => {
  const [playing, setPlaying] = useState(false);
  const watchUrl = vertical ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`;
  return (
    <>
      <div className={`av-video${vertical ? ' is-vertical' : ''}`}>
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button type="button" className="av-video__poster" onClick={() => setPlaying(true)} aria-label={`Play ${title}`}>
            <img src={poster} alt="" loading="lazy" />
            <span className="av-video__play tw">PLAY</span>
          </button>
        )}
      </div>
      {playing && (
        <a className="av-ro av-video__out" href={watchUrl} target="_blank" rel="noreferrer">
          NOT PLAYING? OPEN ON YOUTUBE
        </a>
      )}
    </>
  );
};

const ReleaseCard: React.FC<{ release: Release; palette: ReturnType<typeof skyPalette> }> = ({ release, palette }) => {
  const t = telemetryFor(release.slug);
  return (
    <article className="av-card">
      <SpectrumWindow telemetry={t} palette={palette} seedKey={release.slug} to={tuneLink(release)} label={`Tune in to ${release.title} in the terminal`} />
      <h3 className="tw ink">{release.title.toUpperCase()}</h3>
      <div className="av-ro">
        {release.freq} / {t ? `${formatDuration(t.dur)} / ${t.lufs.toFixed(1)} LUFS` : `NO MASTER ON FILE / ${release.date}`}
      </div>
    </article>
  );
};

export const AVPage: React.FC = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const h = localHour(now);
  const palette = skyPalette(h);
  const lead = latestRelease();
  const leadT = telemetryFor(lead.slug);
  const ep2 = RELEASES.filter((r) => r.group === 'EP2');
  const ep1 = RELEASES.filter((r) => r.group === 'EP1');
  const films = RELEASES.filter((r) => r.film).reverse();
  const excerpts = [
    ...RELEASES.slice()
      .reverse()
      .flatMap((r) => r.excerpts.map((id, i) => ({ id, title: r.excerpts.length > 1 ? `${r.title} ${i + 1}` : r.title }))),
    ...LOOSE_EXCERPTS,
  ];

  return (
    <div className="av-page">
      <svg width="0" height="0" className="av-defs" aria-hidden="true" focusable="false">
        <filter id="av-ink" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={23} />
          <feDisplacementMap in="SourceGraphic" scale={1.8} />
        </filter>
        <filter id="av-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={3} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <svg className="av-grain" aria-hidden="true">
        <rect width="100%" height="100%" filter="url(#av-noise)" />
      </svg>

      <main className="av-wrap">
        <div className="av-ro av-sky">
          <span>LOCAL {pad2(now.getHours())}:{pad2(now.getMinutes())}</span>
          <span>{skyPhase(h)}</span>
          <span>MOON {Math.round(moonLit(moonPhase(now.getTime())) * 100)}%</span>
        </div>

        <section className="av-hero" aria-labelledby="av-latest">
          <div className="av-hero__win">
            <SpectrumWindow telemetry={leadT} palette={palette} seedKey={lead.slug} to={tuneLink(lead)} label={`Tune in to ${lead.title} in the terminal`} />
          </div>
          <div className="av-hero__text">
            <h1 className="sr-only">A/V</h1>
            <GritText text="A/V" id="av-title" className="av-title" />
            <div className="av-ro">LATEST TRANSMISSION</div>
            <h2 id="av-latest" className="tw ink av-hero__name">
              <span className="av-ribbon">{lead.title.toUpperCase()}</span>
            </h2>
            {leadT && (
              <div className="av-ro av-hero__meta">
                {lead.freq} / {formatDuration(leadT.dur)} / {leadT.lufs.toFixed(1)} LUFS / RANGE {leadT.lra.toFixed(1)} LU
                <br />
                {leadT.key ? `${leadT.key.toUpperCase()} / ` : ''}CENTROID {leadT.centroid} HZ
              </div>
            )}
            <div className="tw av-links">
              <a className="av-tl" href={SPOTIFY} target="_blank" rel="noreferrer">
                LISTEN
              </a>
              <Link className="av-tl" to={tuneLink(lead)}>
                TUNE IN
              </Link>
            </div>
          </div>
        </section>

        <section className="av-section" aria-labelledby="av-ep2">
          <div className="av-sh">
            <h2 id="av-ep2" className="tw ink">EP2</h2>
            <span className="av-ro">2026.08.28 / FOUR TRANSMISSIONS</span>
          </div>
          <div className="av-row4">
            {ep2.map((r) => (
              <ReleaseCard key={r.slug} release={r} palette={palette} />
            ))}
          </div>
        </section>

        <section className="av-section" aria-labelledby="av-ep1">
          <div className="av-sh">
            <h2 id="av-ep1" className="tw ink">PILLARS EP</h2>
            <span className="av-ro">2026.04.13 / FIVE TRANSMISSIONS</span>
          </div>
          <div className="av-row5">
            {ep1.map((r) => (
              <ReleaseCard key={r.slug} release={r} palette={palette} />
            ))}
          </div>
        </section>

        <section className="av-section" aria-labelledby="av-films">
          <div className="av-sh">
            <h2 id="av-films" className="tw ink">FILMS</h2>
          </div>
          <div className="av-films">
            {films.map((r) => (
              <figure key={r.slug}>
                <YouTubeFrame id={r.film!} title={`${r.title}, official visual`} poster={`/av/films/${r.film}.jpg`} />
                <figcaption>
                  <span className="tw">{r.title.toUpperCase()}</span>
                  <span className="av-ro">OFFICIAL VISUAL / {r.date}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="av-section" aria-labelledby="av-excerpts">
          <div className="av-sh">
            <h2 id="av-excerpts" className="tw ink">EXCERPTS</h2>
            <span className="av-ro">{excerpts.length} VERTICAL VISUALS</span>
          </div>
          <div className="av-strip">
            {excerpts.map((x) => (
              <figure key={x.id}>
                <YouTubeFrame id={x.id} title={x.title} poster={`/av/excerpts/${x.id}.jpg`} vertical />
                <figcaption className="av-ro">{x.title.toUpperCase()}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <footer className="av-foot">
          <a href="mailto:music@signal23.net">music@signal23.net</a>
          <Link className="av-ro" to="/legal/privacy">
            PRIVACY
          </Link>
        </footer>
      </main>
    </div>
  );
};
