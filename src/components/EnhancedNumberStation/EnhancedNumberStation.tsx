import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface NumberStationProps {
  isMobile: boolean;
  onGlitchChange: (isGlitching: boolean) => void;
}

type SequenceItem = {
  value: string;
  opacity: number;
  isGlitched: boolean;
};

const BASE_OPACITY = 0.7;
const HIDDEN_OPACITY = 0;
const SEQUENCE_LENGTH = 8;
const SPECIAL_CHARACTERS = ['0', '1', '█', '▓', '▒', '░'];
const WARNING_MESSAGES = [
  'THIS PLACE IS A MESSAGE AND PART OF A SYSTEM OF MESSAGES',
  'WHAT IS HERE IS DANGEROUS AND REPULSIVE TO US',
  'THE DANGER IS STILL PRESENT IN YOUR TIME AS IT WAS IN OURS',
  'DO NOT DISTURB',
  'SIGNAL DETECTED',
  'TRANSMISSION ACTIVE',
  'DATA CORRUPTION DETECTED',
];

const createInitialSequence = (): SequenceItem[] =>
  Array.from({ length: SEQUENCE_LENGTH }, () => ({
    value: SPECIAL_CHARACTERS[Math.floor(Math.random() * SPECIAL_CHARACTERS.length)],
    opacity: BASE_OPACITY,
    isGlitched: Math.random() > 0.8,
  }));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const useNumberStationSequence = (onGlitchChange: (isGlitching: boolean) => void) => {
  const [sequence, setSequence] = useState<SequenceItem[]>(() => createInitialSequence());
  const [warning, setWarning] = useState('');
  const [glitchEffect, setGlitchEffect] = useState(false);

  const triggerGlitch = useCallback((index: number) => {
    setSequence((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
            ...item,
            value: ['█', '▓', '▒', '░'][Math.floor(Math.random() * 4)],
            opacity: Math.random() * BASE_OPACITY + 0.3,
            isGlitched: true,
          }
          : item,
      ),
    );
  }, []);

  const flashNumbers = useCallback(
    async (indices: number[], duration: number) => {
      const shouldGlitch = Math.random() > 0.7;
      if (shouldGlitch) {
        setGlitchEffect(true);
      }

      setSequence((prev) =>
        prev.map((item, index) =>
          indices.includes(index) ? { ...item, opacity: BASE_OPACITY } : item,
        ),
      );

      if (shouldGlitch) {
        indices.forEach((index) => triggerGlitch(index));
      }

      await delay(duration);

      setSequence((prev) =>
        prev.map((item, index) =>
          indices.includes(index) ? { ...item, opacity: HIDDEN_OPACITY, isGlitched: false } : item,
        ),
      );

      setGlitchEffect(false);
      await delay(duration * 0.5);
    },
    [triggerGlitch],
  );

  const runPattern = useCallback(async () => {
    const patternLength = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < patternLength; i += 1) {
      const indices = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => Math.floor(Math.random() * SEQUENCE_LENGTH));
      // eslint-disable-next-line no-await-in-loop
      await flashNumbers(indices, 200);
    }
  }, [flashNumbers]);

  useEffect(() => {
    const warningInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        const nextWarning = WARNING_MESSAGES[Math.floor(Math.random() * WARNING_MESSAGES.length)];
        setWarning(nextWarning);
        onGlitchChange(true);

        setTimeout(() => {
          setWarning('');
          onGlitchChange(false);
        }, 2000);
      }
    }, 7000);

    return () => clearInterval(warningInterval);
  }, [onGlitchChange]);

  useEffect(() => {
    let isMounted = true;

    const iterate = async () => {
      if (!isMounted) {
        return;
      }

      setSequence(createInitialSequence());
      await runPattern();

      setTimeout(iterate, Math.random() * 1000 + 2000);
    };

    iterate();

    return () => {
      isMounted = false;
    };
  }, [runPattern]);

  return { sequence, warning, glitchEffect };
};

export const EnhancedNumberStation: React.FC<NumberStationProps> = ({ isMobile, onGlitchChange }) => {
  const { sequence, warning, glitchEffect } = useNumberStationSequence(onGlitchChange);

  const containerClass = useMemo(
    () => (isMobile ? 'flex justify-between items-start pt-2' : 'flex flex-col justify-center'),
    [isMobile],
  );

  return (
    <div className="fixed top-0 left-0 w-full h-24 px-6 font-mono pointer-events-none">
      <div className={`h-full ${containerClass}`}>
        <div
          className={`flex space-x-2 ${glitchEffect ? 'animate-pulse' : ''}`}
          style={{
            textShadow: glitchEffect ? '2px 2px 8px rgba(255,255,255,0.5)' : 'none',
            transform: glitchEffect ? 'translateX(-1px)' : 'none',
            transition: 'transform 0.1s',
          }}
        >
          {sequence.map((item, index) => (
            <span
              key={`${item.value}-${index}`}
              className="transition-all duration-100"
              style={{
                opacity: item.opacity,
                color: 'white',
                transform: item.isGlitched ? 'translateY(1px)' : 'none',
                textShadow: item.isGlitched ? '1px 1px 4px rgba(255,255,255,0.3)' : 'none',
              }}
            >
              {item.value}
            </span>
          ))}
        </div>
        {warning && (
          <div
            className={`text-xs text-red-500 opacity-70 tracking-wider animate-fadeInOut ${isMobile ? 'mt-8 text-right max-w-[160px]' : 'mt-2'
              }`}
          >
            {warning}
          </div>
        )}
      </div>
    </div>
  );
};
