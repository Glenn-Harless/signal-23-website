import React, { useEffect, useMemo, useState } from 'react';

interface DistortedStackProps {
  isPlayingAudio: boolean;
}

const LAYER_CONFIG = [
  { font: 'neo-brutalist6', mirrored: true },
  { font: 'neo-brutalist6', mirrored: true },
  { font: 'neo-brutalist4', mirrored: true },
  { font: 'neo-brutalist5', mirrored: false, outline: true },
  { font: 'neo-brutalist6', mirrored: true },
  { font: 'neo-brutalist7', mirrored: true },
  { font: 'neo-brutalist8', mirrored: true },
];

export const DistortedStack: React.FC<DistortedStackProps> = ({ isPlayingAudio }) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const layers = useMemo(() => LAYER_CONFIG, []);

  return (
    <>
      <div className="absolute right-0 lg:right-20 top-0 h-full flex flex-col justify-center">
        <div className="space-y-6 transform-gpu">
          {layers.map((layer, index) => {
            const baseClass = `text-4xl md:text-5xl lg:text-6xl font-bold font-${layer.font} transform-gpu transition-all duration-300 px-6 lg:px-0`;
            const textColorClass = layer.outline ? '' : 'text-white';
            const animationDuration = `${2 + index * 0.1}s`;
            const filterStyle = layer.outline
              ? { filter: 'url(#irregular-outline)', WebkitTextStroke: '0.02px white', color: 'black' }
              : {
                  filter: isPlayingAudio ? 'url(#playing-effect)' : 'url(#default-effect)',
                  transition: 'filter 0.3s ease',
                  animationDuration,
                };

            const className = [baseClass, textColorClass, !layer.outline && 'distorted-pulse']
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={`${layer.font}-${index}`}
                style={filterStyle}
                className={className}
              >
                {layer.mirrored ? (
                  <span style={{ transform: 'scale(-1, 1)' }} className="inline-block">
                    SIGNAL23
                  </span>
                ) : (
                  'SIGNAL23'
                )}
              </div>
            );
          })}
        </div>
      </div>

      <svg className="hidden">
        <defs>
          <filter id="default-effect">
            <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="5" seed={offset} />
            <feDisplacementMap in="SourceGraphic" scale="12" />
            <feGaussianBlur stdDeviation=".3" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.8" intercept="-0.2" />
              <feFuncG type="linear" slope="1.8" intercept="-0.2" />
              <feFuncB type="linear" slope="1.8" intercept="-0.2" />
            </feComponentTransfer>
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>

          <filter id="playing-effect">
            <feTurbulence type="fractalNoise" baseFrequency="2.5" numOctaves="6" seed={offset} />
            <feDisplacementMap in="SourceGraphic" scale="25" />
            <feGaussianBlur stdDeviation="1.5" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="2" intercept="-0.2" />
              <feFuncG type="linear" slope="2" intercept="-0.2" />
              <feFuncB type="linear" slope="2" intercept="-0.2" />
            </feComponentTransfer>
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>

          <filter id="irregular-outline">
            <feTurbulence type="turbulence" baseFrequency="0.7" numOctaves="3" seed={offset} />
            <feDisplacementMap in="SourceGraphic" scale="1" />
            <feGaussianBlur stdDeviation="0.03" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.2" />
              <feFuncG type="linear" slope="1.2" />
              <feFuncB type="linear" slope="1.2" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
    </>
  );
};
