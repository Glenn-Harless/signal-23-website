import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Transmission, transmissions } from '../../data/transmissions';
import './Atlas.css';

// The hidden art index shows only the visual "art" routes — not public/commerce/legacy.
const ART_PAGES = transmissions.filter((transmission) => transmission.type === 'visual');

const matchesQuery = (transmission: Transmission, query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [
    transmission.title,
    transmission.slug,
    transmission.route,
    transmission.notes ?? '',
    ...transmission.tags,
  ]
    .join(' ')
    .toLowerCase()
    .includes(normalized);
};

export const Atlas: React.FC = () => {
  const [query, setQuery] = useState('');

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

  const filtered = useMemo(() => ART_PAGES.filter((transmission) => matchesQuery(transmission, query)), [query]);

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
            placeholder="SEARCH"
            type="search"
          />
        </label>
      </header>

      <section className="atlas-grid" aria-label="Transmission index">
        {filtered.map((transmission) => (
          <Link key={transmission.slug} className="atlas-tile" to={transmission.route}>
            <div className="atlas-thumb">
              <img
                src={`/thumbnails/${transmission.slug}.jpg`}
                alt={transmission.title}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.visibility = 'hidden';
                }}
              />
              <span className="atlas-route">{transmission.route}</span>
            </div>
            <div className="atlas-meta">
              <span className="atlas-name">{transmission.title}</span>
              <span className="atlas-tags">{transmission.tags.slice(0, 3).join(' · ')}</span>
            </div>
          </Link>
        ))}
      </section>

      {filtered.length === 0 && (
        <p className="atlas-empty" role="status">
          NO SIGNALS MATCH
        </p>
      )}
    </main>
  );
};
