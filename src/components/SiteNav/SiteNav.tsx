import React from 'react';
import { Link } from 'react-router-dom';
import { SITE_NAV_ITEMS, isSiteNavItemActive } from '../../data/siteNav';
import './SiteNav.css';

interface SiteNavProps {
  path: string;
}

// Per-character delay for the one-time type-in when the shell first mounts.
const STRIKE_MS = 55;

export const SiteNav: React.FC<SiteNavProps> = ({ path }) => {
  const surface = path === '/terminal' ? 'terminal' : path === '/' ? 'home' : 'page';
  let strike = 0;

  return (
    <nav className="site-nav" data-surface={surface} aria-label="Site">
      <ul className="site-nav__list">
        {SITE_NAV_ITEMS.map((item) => {
          const active = isSiteNavItemActive(item, path);
          const chars = item.label.split('').map((char) => {
            const delay = strike * STRIKE_MS;
            strike += 1;
            return (
              <span key={delay} className="site-nav__char" style={{ animationDelay: `${delay}ms` }}>
                {char}
              </span>
            );
          });
          // A short pause between words, like the space bar.
          strike += 2;

          return (
            <li key={item.to} className="site-nav__item">
              <Link
                to={item.to}
                className={`site-nav__link${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                aria-label={item.label}
              >
                <span className="site-nav__word" aria-hidden="true">
                  <span className="site-nav__ink">{chars}</span>
                  <span className="site-nav__ribbon" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <svg className="site-nav__defs" aria-hidden="true" focusable="false">
        <defs>
          {/* Worn typebar strike: a small, static displacement so edges read as ink on paper, not pixels. */}
          <filter id="site-nav-ink" x="-5%" y="-20%" width="110%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="23" result="grain" />
            <feDisplacementMap in="SourceGraphic" in2="grain" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </nav>
  );
};
