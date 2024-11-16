import React, { useEffect, useState } from 'react';

export const DistortedStack = ({ isPlayingAudio }) => {
    const [offset, setOffset] = useState(0);
    const fontFamilies = [
      'neo-brutalist6',
      'neo-brutalist6',
      'neo-brutalist4',
      'neo-brutalist5',
      'neo-brutalist6',
      'neo-brutalist7',
      'neo-brutalist8',
      'neo-brutalist9'
    ];

    useEffect(() => {
      const interval = setInterval(() => {
        setOffset(prev => (prev + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    }, []);
  
    return (
      <>
        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.85; }
            }
          `}
        </style>
        <div className="absolute right-0 lg:right-20 top-0 h-full flex flex-col justify-center">
          <div className="space-y-6 transform-gpu">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                style={{
                  ...i === 3 
                    ? {
                        WebkitTextStroke: '0.02px white',
                        color: 'black',
                        filter: 'url(#irregular-outline)'
                      }
                    : {
                        filter: isPlayingAudio ? 'url(#playing-effect)' : 'url(#default-effect)',
                        animation: `pulse ${2 + i * 0.1}s ease-in-out infinite`,
                        transition: 'filter 0.3s ease'
                      }
                }}
                className={`
                  text-4xl md:text-5xl lg:text-6xl 
                  font-bold 
                  font-${fontFamilies[i]}
                  transform-gpu
                  transition-all duration-300
                  ${i === 3 ? '' : 'text-white'}
                  px-6 lg:px-0
                `}
              >
                {i === 3 ? 'SIGNAL23' : (
                  <div 
                    style={{ transform: 'scale(-1, 1)' }} 
                    className="inline-block"
                  >
                    SIGNAL23
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
  
        <svg className="hidden">
          <defs>
            {/* Default effect with mild erosion */}
            <filter id="default-effect">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="1.2"
                numOctaves="5"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="12"
              />
              <feGaussianBlur stdDeviation=".3"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncG type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncB type="linear" slope="1.8" intercept="-0.2"/>
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic"/>
            </filter>
  
            {/* More intense effect for when playing */}
            <filter id="playing-effect">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="2.5"
                numOctaves="6"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="25"
              />
              <feGaussianBlur stdDeviation="1.5"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="2" intercept="-0.2"/>
                <feFuncG type="linear" slope="2" intercept="-0.2"/>
                <feFuncB type="linear" slope="2" intercept="-0.2"/>
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic"/>
            </filter>

            {/* Outline effect */}
            <filter id="irregular-outline">
              <feTurbulence 
                type="turbulence" 
                baseFrequency="0.7"
                numOctaves="3"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="1"
              />
              <feGaussianBlur stdDeviation="0.03"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.2"/>
                <feFuncG type="linear" slope="1.2"/>
                <feFuncB type="linear" slope="1.2"/>
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>
      </>
    );
  };