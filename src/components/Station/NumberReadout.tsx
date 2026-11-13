import React, { useEffect, useRef } from 'react';
import { StationBroadcast, useBroadcastState } from './broadcast';
import { isRealGroup } from '../../data/numberStation';

interface NumberReadoutProps {
  broadcast: StationBroadcast;
  isAudioPlaying: boolean;
  onListen: () => void;
}

/**
 * The station's readout: the group being sent, digit by digit, then the next two.
 * The red dot blinks with the transmitter and doubles as the hidden listen button.
 */
export const NumberReadout: React.FC<NumberReadoutProps> = ({ broadcast, isAudioPlaying, onListen }) => {
  const { groups, index, digit } = useBroadcastState(broadcast);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (dotRef.current) dotRef.current.style.opacity = (0.15 + 0.85 * broadcast.blink).toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [broadcast]);

  const current = groups[index];
  const next = [1, 2].map((k) => groups[(index + k) % groups.length]);

  return (
    <div className="station-readout" aria-hidden="false">
      <span className="station-readout__mark" aria-hidden="true">░ ▓</span>
      <button
        type="button"
        className="station-readout__light"
        aria-label={isAudioPlaying ? 'Stop listening' : 'Listen'}
        aria-pressed={isAudioPlaying}
        onClick={onListen}
      >
        <span ref={dotRef} className="station-readout__dot" />
      </button>
      <span className={isRealGroup(current) ? 'station-readout__group is-marked' : 'station-readout__group'} aria-hidden="true">
        {current.split('').map((ch, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <span key={i} className={i < digit ? 'is-sent' : i === digit ? 'is-now' : 'is-waiting'}>
            {ch}
          </span>
        ))}
      </span>
      {next.map((g, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <span key={`${g}-${i}`} className={`station-readout__next${isRealGroup(g) ? ' is-marked' : ''}`} aria-hidden="true">
          {g}
        </span>
      ))}
    </div>
  );
};
