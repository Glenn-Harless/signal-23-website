import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Search } from 'lucide-react';
import {
  Transmission,
  TransmissionStatus,
  TransmissionType,
  TransmissionVisibility,
  transmissions,
} from '../../data/transmissions';
import './Operator.css';

type FilterValue<T extends string> = T | 'all';

const typeOptions: Array<FilterValue<TransmissionType>> = [
  'all',
  'visual',
  'interactive',
  'release',
  'artifact',
  'page',
  'commerce',
];

const statusOptions: Array<FilterValue<TransmissionStatus>> = [
  'all',
  'active',
  'wip',
  'archived',
  'broken',
];

const visibilityOptions: Array<FilterValue<TransmissionVisibility>> = [
  'all',
  'public',
  'soft-secret',
  'operator-only',
  'deprecated',
];

const formatLabel = (value: string) => value.replace(/-/g, ' ').toUpperCase();

const formatExportCapability = (transmission: Transmission) => {
  if (!transmission.visualExport) {
    return '—';
  }

  const targets = transmission.visualExport.supportedTargets.join(', ');
  return transmission.visualExport.hardwareFeedSafe ? `${targets} · HFS` : targets;
};

const matchesQuery = (transmission: Transmission, query: string) => {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  const searchable = [
    transmission.slug,
    transmission.route,
    transmission.title,
    transmission.type,
    transmission.status,
    transmission.visibility,
    transmission.release ?? '',
    transmission.notes ?? '',
    transmission.visualExport?.defaultTarget ?? '',
    transmission.visualExport?.capture ?? '',
    transmission.visualExport?.hardwareFeedSafe ? 'hfs hardware-feed-safe' : '',
    transmission.visualExport?.operatorNotes ?? '',
    ...transmission.tags,
    ...transmission.exportUse,
    ...(transmission.visualExport?.supportedTargets ?? []),
    ...(transmission.visualExport?.aspectRatios.supported ?? []),
  ].join(' ').toLowerCase();

  return searchable.includes(normalized);
};

export const OperatorIndex: React.FC = () => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterValue<TransmissionType>>('all');
  const [statusFilter, setStatusFilter] = useState<FilterValue<TransmissionStatus>>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<FilterValue<TransmissionVisibility>>('all');

  useEffect(() => {
    const previousTitle = document.title;
    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const robotsMeta = existingRobots ?? document.createElement('meta');
    const previousRobotsContent = existingRobots?.getAttribute('content');

    document.title = 'Signal-23 Operator';
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

  const filteredTransmissions = useMemo(
    () =>
      transmissions.filter((transmission) => {
        const typeMatches = typeFilter === 'all' || transmission.type === typeFilter;
        const statusMatches = statusFilter === 'all' || transmission.status === statusFilter;
        const visibilityMatches = visibilityFilter === 'all' || transmission.visibility === visibilityFilter;

        return typeMatches && statusMatches && visibilityMatches && matchesQuery(transmission, query);
      }),
    [query, statusFilter, typeFilter, visibilityFilter],
  );

  const counts = useMemo(
    () => ({
      total: transmissions.length,
      active: transmissions.filter((transmission) => transmission.status === 'active').length,
      softSecret: transmissions.filter((transmission) => transmission.visibility === 'soft-secret').length,
      exports: transmissions.filter((transmission) => transmission.exportUse.length > 0).length,
    }),
    [],
  );

  return (
    <main className="operator-page">
      <section className="operator-shell" aria-labelledby="operator-title">
        <header className="operator-header">
          <div>
            <p className="operator-kicker">S23 INTERNAL</p>
            <h1 id="operator-title">OPERATOR MAP</h1>
          </div>
          <div className="operator-header-meta" aria-label="Registry totals">
            <span>{counts.total} routes</span>
            <span>{counts.active} active</span>
            <span>{counts.softSecret} soft-secret</span>
            <span>{counts.exports} export-ready</span>
          </div>
        </header>

        <section className="operator-controls" aria-label="Transmission filters">
          <label className="operator-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Search transmissions</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="SEARCH"
              type="search"
            />
          </label>

          <label>
            <span>TYPE</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as FilterValue<TransmissionType>)}
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {formatLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>STATUS</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as FilterValue<TransmissionStatus>)}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {formatLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>VISIBILITY</span>
            <select
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value as FilterValue<TransmissionVisibility>)}
            >
              {visibilityOptions.map((option) => (
                <option key={option} value={option}>
                  {formatLabel(option)}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="operator-table-wrap" aria-label="Transmission registry">
          <table className="operator-table">
            <thead>
              <tr>
                <th scope="col">SIGNAL</th>
                <th scope="col">ROUTE</th>
                <th scope="col">TYPE</th>
                <th scope="col">STATUS</th>
                <th scope="col">VISIBILITY</th>
                <th scope="col">EXPORT</th>
                <th scope="col">TAGS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransmissions.map((transmission) => (
                <tr key={transmission.slug}>
                  <td data-label="Signal">
                    <Link className="operator-title-link" to={`/operator/transmissions/${transmission.slug}`}>
                      {transmission.title}
                    </Link>
                    {transmission.release && (
                      <span className="operator-release">{transmission.release}</span>
                    )}
                  </td>
                  <td data-label="Route">
                    <a className="operator-route" href={transmission.route} target="_blank" rel="noreferrer">
                      {transmission.route}
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </td>
                  <td data-label="Type">{formatLabel(transmission.type)}</td>
                  <td data-label="Status">
                    <span className={`operator-status operator-status-${transmission.status}`}>
                      {formatLabel(transmission.status)}
                    </span>
                  </td>
                  <td data-label="Visibility">{formatLabel(transmission.visibility)}</td>
                  <td data-label="Export">
                    {formatExportCapability(transmission)}
                  </td>
                  <td data-label="Tags">
                    <div className="operator-tags">
                      {transmission.tags.slice(0, 4).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTransmissions.length === 0 && (
            <div className="operator-empty" role="status">
              NO MATCHING TRANSMISSIONS
            </div>
          )}
        </section>
      </section>
    </main>
  );
};
