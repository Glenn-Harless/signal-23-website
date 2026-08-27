import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Transmission, transmissions } from '../../data/transmissions';
import './Atlas.css';

// The hidden art index shows only soft-secret visual routes, newest first.
const ART_PAGES = transmissions
  .filter(
    (transmission) =>
      transmission.type === 'visual' &&
      transmission.visibility === 'soft-secret',
  )
  .sort((left, right) => right.addedAt.localeCompare(left.addedAt));

const LATEST_TRANSMISSION = ART_PAGES[0];
const sequenceBySlug = new Map(
  ART_PAGES.map((transmission, index) => [transmission.slug, index + 1]),
);

const formatAddedAt = (addedAt: string) => addedAt.replace(/-/g, '.');

const hideBrokenImage = (event: React.SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.hidden = true;
};

const matchesQuery = (transmission: Transmission, query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [
    transmission.title,
    transmission.slug,
    transmission.route,
    transmission.release ?? '',
    transmission.status,
    transmission.addedAt,
    transmission.notes ?? '',
    ...transmission.tags,
  ]
    .join(' ')
    .toLowerCase()
    .includes(normalized);
};

export const Atlas: React.FC = () => {
  const [query, setQuery] = useState('');
  const isSearching = query.trim().length > 0;

  // Keep this page out of search indexes (same pattern as OperatorIndex).
  useEffect(() => {
    const previousTitle = document.title;
    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const robotsMeta = existingRobots ?? document.createElement('meta');
    const previousRobotsContent = existingRobots?.getAttribute('content');

    document.title = 'SIGNAL-23 // INDEX';
    robotsMeta.setAttribute('name', 'robots');
    robotsMeta.setAttribute('content', 'noindex,nofollow');

    if (!existingRobots) {
      document.head.appendChild(robotsMeta);
    }

    return () => {
      document.title = previousTitle;

      if (existingRobots && previousRobotsContent !== null && previousRobotsContent !== undefined) {
        existingRobots.setAttribute('content', previousRobotsContent);
      } else if (existingRobots) {
        existingRobots.removeAttribute('content');
      } else {
        robotsMeta.remove();
      }
    };
  }, []);

  const filtered = useMemo(
    () => ART_PAGES.filter((transmission) => matchesQuery(transmission, query)),
    [query],
  );
  const archivePages = isSearching
    ? filtered
    : filtered.filter((transmission) => transmission.slug !== LATEST_TRANSMISSION?.slug);

  const resultLabel = isSearching
    ? `${filtered.length} ${filtered.length === 1 ? 'match' : 'matches'} / ${ART_PAGES.length}`
    : `${archivePages.length} stored signals`;

  return (
    <main className="atlas">
      <header className="atlas-header">
        <div className="atlas-headings">
          <p className="atlas-kicker">SIGNAL — 23</p>
          <h1 className="atlas-title">THE ARRAY</h1>
          <p className="atlas-sub">{ART_PAGES.length} transmissions · private index</p>
        </div>
        <label className="atlas-search">
          <Search size={15} aria-hidden="true" />
          <span className="sr-only">Search transmissions</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setQuery('');
              }
            }}
            placeholder="SEARCH"
            type="search"
          />
        </label>
      </header>

      {!isSearching && LATEST_TRANSMISSION && (
        <section className="atlas-latest" aria-labelledby="atlas-latest-title">
          <Link className="atlas-latest-link" to={LATEST_TRANSMISSION.route}>
            <div className="atlas-latest-visual">
              <div className="atlas-image-fallback" aria-hidden="true">
                <span>{LATEST_TRANSMISSION.slug}</span>
              </div>
              <img
                src={`/thumbnails/${LATEST_TRANSMISSION.slug}.jpg`}
                alt=""
                width={640}
                height={400}
                loading="eager"
                onError={hideBrokenImage}
              />
              <span className="atlas-latest-label">LATEST INTERCEPT</span>
              <span className="atlas-latest-route">{LATEST_TRANSMISSION.route}</span>
            </div>
            <div className="atlas-latest-copy">
              <p className="atlas-latest-stamp">
                {LATEST_TRANSMISSION.status} / {formatAddedAt(LATEST_TRANSMISSION.addedAt)}
              </p>
              <h2 id="atlas-latest-title">{LATEST_TRANSMISSION.title}</h2>
              <p className="atlas-latest-release">
                {LATEST_TRANSMISSION.release
                  ? `RELEASE // ${LATEST_TRANSMISSION.release}`
                  : 'VISUAL SYSTEM'}
              </p>
              <p className="atlas-latest-tags">
                {LATEST_TRANSMISSION.tags.slice(0, 5).join(' · ')}
              </p>
              <span className="atlas-enter">ENTER TRANSMISSION →</span>
            </div>
          </Link>
        </section>
      )}

      <div className="atlas-archive-header">
        <h2>{isSearching ? 'SEARCH RETURN' : 'ARCHIVE'}</h2>
        <p className="atlas-results" aria-live="polite">
          {resultLabel}
        </p>
      </div>

      <section className="atlas-grid" aria-label="Transmission archive">
        {archivePages.map((transmission) => {
          const sequence = sequenceBySlug.get(transmission.slug) ?? 0;

          return (
            <Link key={transmission.slug} className="atlas-tile" to={transmission.route}>
              <div className="atlas-thumb">
                <div className="atlas-image-fallback" aria-hidden="true">
                  <span>{transmission.slug}</span>
                </div>
                <img
                  src={`/thumbnails/${transmission.slug}.jpg`}
                  alt=""
                  width={640}
                  height={400}
                  loading="lazy"
                  onError={hideBrokenImage}
                />
                <span className="atlas-sequence">{String(sequence).padStart(2, '0')}</span>
                <span className="atlas-route">{transmission.route}</span>
              </div>
              <div className="atlas-meta">
                <div className="atlas-meta-primary">
                  <span className="atlas-name">{transmission.title}</span>
                  <span className="atlas-stamp">
                    {formatAddedAt(transmission.addedAt)} · {transmission.status}
                  </span>
                </div>
                <span className="atlas-tags">{transmission.tags.slice(0, 3).join(' · ')}</span>
                {transmission.release && (
                  <span className="atlas-release">release // {transmission.release}</span>
                )}
              </div>
            </Link>
          );
        })}
      </section>

      {archivePages.length === 0 && (
        <p className="atlas-empty">
          NO SIGNALS MATCH
        </p>
      )}
    </main>
  );
};
