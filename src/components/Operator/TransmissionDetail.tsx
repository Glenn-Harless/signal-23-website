import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getTransmissionBySlug, transmissions } from '../../data/transmissions';
import './Operator.css';

const formatLabel = (value: string) => value.replace(/-/g, ' ').toUpperCase();

const formatAspect = (
  aspect: string,
  defaultAspect: string,
) => (aspect === defaultAspect ? `${aspect} (default)` : aspect);

const formatDuration = (duration: {
  supported: boolean;
  defaultSeconds?: number;
  minSeconds?: number;
  maxSeconds?: number;
}) => {
  if (!duration.supported) {
    return 'indefinite';
  }

  const range = typeof duration.minSeconds === 'number' && typeof duration.maxSeconds === 'number'
    ? `${duration.minSeconds}-${duration.maxSeconds}s`
    : 'operator-set';
  const defaultValue = typeof duration.defaultSeconds === 'number'
    ? ` (default ${duration.defaultSeconds}s)`
    : '';

  return `${range}${defaultValue}`;
};

export const TransmissionDetail: React.FC = () => {
  const { slug = '' } = useParams();
  const transmission = getTransmissionBySlug(slug);
  const index = transmission
    ? transmissions.findIndex((candidate) => candidate.slug === transmission.slug)
    : -1;
  const previousTransmission = index > 0 ? transmissions[index - 1] : undefined;
  const nextTransmission = index >= 0 && index < transmissions.length - 1 ? transmissions[index + 1] : undefined;

  useEffect(() => {
    const previousTitle = document.title;
    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const robotsMeta = existingRobots ?? document.createElement('meta');
    const previousRobotsContent = existingRobots?.getAttribute('content');

    document.title = transmission ? `${transmission.title} - Signal-23 Operator` : 'Signal-23 Operator';
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
  }, [transmission]);

  if (!transmission) {
    return (
      <main className="operator-page">
        <section className="operator-shell operator-detail-shell">
          <Link className="operator-back-link" to="/operator">
            <ArrowLeft size={16} aria-hidden="true" />
            OPERATOR MAP
          </Link>
          <div className="operator-empty operator-empty-large" role="status">
            TRANSMISSION NOT FOUND
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="operator-page">
      <article className="operator-shell operator-detail-shell">
        <Link className="operator-back-link" to="/operator">
          <ArrowLeft size={16} aria-hidden="true" />
          OPERATOR MAP
        </Link>

        <header className="operator-detail-header">
          <div>
            <p className="operator-kicker">{formatLabel(transmission.visibility)}</p>
            <h1>{transmission.title}</h1>
          </div>
          <a className="operator-open-route" href={transmission.route} target="_blank" rel="noreferrer">
            OPEN ROUTE
            <ExternalLink size={16} aria-hidden="true" />
          </a>
        </header>

        <section className="operator-detail-grid" aria-label="Transmission metadata">
          <div>
            <span>SLUG</span>
            <strong>{transmission.slug}</strong>
          </div>
          <div>
            <span>ROUTE</span>
            <strong>{transmission.route}</strong>
          </div>
          <div>
            <span>TYPE</span>
            <strong>{formatLabel(transmission.type)}</strong>
          </div>
          <div>
            <span>STATUS</span>
            <strong>{formatLabel(transmission.status)}</strong>
          </div>
          <div>
            <span>RELEASE</span>
            <strong>{transmission.release ?? 'UNASSIGNED'}</strong>
          </div>
          <div>
            <span>ADDED</span>
            <strong>{transmission.addedAt}</strong>
          </div>
        </section>

        <section className="operator-detail-band" aria-label="Export targets">
          <h2>EXPORT USE</h2>
          <div className="operator-tags operator-tags-large">
            {transmission.exportUse.length > 0 ? (
              transmission.exportUse.map((target) => <span key={target}>{formatLabel(target)}</span>)
            ) : (
              <span>NONE</span>
            )}
          </div>
        </section>

        <section className="operator-detail-band" aria-label="Tags">
          <h2>TAGS</h2>
          <div className="operator-tags operator-tags-large">
            {transmission.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </section>

        {transmission.notes && (
          <section className="operator-detail-band" aria-label="Notes">
            <h2>NOTES</h2>
            <p>{transmission.notes}</p>
          </section>
        )}

        {transmission.visualExport && (
          <section className="operator-detail-band" aria-label="Visual export capability">
            <h2>EXPORT CAPABILITY</h2>
            <dl className="operator-capability-list">
              <div>
                <dt>Targets</dt>
                <dd>{transmission.visualExport.supportedTargets.join(', ')}</dd>
              </div>
              <div>
                <dt>Default</dt>
                <dd>{transmission.visualExport.defaultTarget}</dd>
              </div>
              <div>
                <dt>Aspects</dt>
                <dd>
                  {transmission.visualExport.aspectRatios.supported
                    .map((aspect) => formatAspect(aspect, transmission.visualExport!.aspectRatios.default))
                    .join(', ')}
                </dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{formatDuration(transmission.visualExport.duration)}</dd>
              </div>
              <div>
                <dt>Seed</dt>
                <dd>{transmission.visualExport.seed.supported ? 'supported' : 'not supported'}</dd>
              </div>
              <div>
                <dt>Capture</dt>
                <dd>{transmission.visualExport.capture}</dd>
              </div>
              <div>
                <dt>Hardware-feed safe</dt>
                <dd>{transmission.visualExport.hardwareFeedSafe ? 'yes' : 'no'}</dd>
              </div>
              {transmission.visualExport.operatorNotes && (
                <div>
                  <dt>Notes</dt>
                  <dd>{transmission.visualExport.operatorNotes}</dd>
                </div>
              )}
            </dl>

            <div className="operator-launch-links" aria-label="Launch links">
              <h3>LAUNCH LINKS</h3>
              <div>
                {transmission.visualExport.supportedTargets.map((target) => (
                  <a
                    key={target}
                    href={`${transmission.route}?target=${target}`}
                    target="_blank"
                    rel="noopener"
                  >
                    {target}
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        <nav className="operator-detail-nav" aria-label="Adjacent transmissions">
          {previousTransmission ? (
            <Link to={`/operator/transmissions/${previousTransmission.slug}`}>
              PREV: {previousTransmission.title}
            </Link>
          ) : (
            <span />
          )}
          {nextTransmission ? (
            <Link to={`/operator/transmissions/${nextTransmission.slug}`}>
              NEXT: {nextTransmission.title}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </main>
  );
};
