import React, { useEffect, useRef } from 'react';

// The homepage's gritty glyph treatment for page titles: the live site's noise filter with its seed
// stepped every 50 ms, stacked in the Neo Brutalist cuts.
const LAYERS = [
  { font: 'font-neo-brutalist6', mirrored: true },
  { font: 'font-neo-brutalist4', mirrored: true },
  { font: 'font-neo-brutalist5', mirrored: false, outline: true },
  { font: 'font-neo-brutalist7', mirrored: true },
];

interface GritTextProps {
  text: string;
  id: string;
  className?: string;
}

export const GritText: React.FC<GritTextProps> = ({ text, id, className = '' }) => {
  const live = useRef<SVGFETurbulenceElement>(null);
  const outline = useRef<SVGFETurbulenceElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let seed = 0;
    const timer = setInterval(() => {
      seed = (seed + 1) % 100;
      live.current?.setAttribute('seed', String(seed));
      outline.current?.setAttribute('seed', String(seed));
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`grit-text ${className}`}>
      <svg width="0" height="0" className="grit-text__defs" aria-hidden="true" focusable="false">
        <filter id={`${id}-live`}>
          <feTurbulence ref={live} type="fractalNoise" baseFrequency="1.2" numOctaves={5} seed={0} />
          <feDisplacementMap in="SourceGraphic" scale={12} />
          <feGaussianBlur stdDeviation="0.3" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.8" intercept="-0.2" />
            <feFuncG type="linear" slope="1.8" intercept="-0.2" />
            <feFuncB type="linear" slope="1.8" intercept="-0.2" />
          </feComponentTransfer>
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
        <filter id={`${id}-outline`}>
          <feTurbulence ref={outline} type="turbulence" baseFrequency="0.7" numOctaves={3} seed={0} />
          <feDisplacementMap in="SourceGraphic" scale={1} />
        </filter>
      </svg>
      {LAYERS.map((layer, i) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          aria-hidden={i > 0}
          className={`grit-text__layer ${layer.font}${layer.outline ? ' is-outline' : ''}`}
          style={{ filter: `url(#${id}-${layer.outline ? 'outline' : 'live'})`, animationDuration: `${2 + i * 0.1}s` }}
        >
          {layer.mirrored ? <span className="grit-text__mirror">{text}</span> : text}
        </div>
      ))}
    </div>
  );
};
