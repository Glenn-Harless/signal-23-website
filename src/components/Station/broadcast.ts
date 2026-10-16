import { useEffect, useState } from 'react';
import { flashSequence, FlashSequence, scheduleFor } from '../../data/numberStation';

export type BroadcastMode = 'pool' | 'callup';

export type BroadcastState = {
  mode: BroadcastMode;
  groups: string[];
  index: number;
  /** Digit being sent; equals the group length once the whole group has been sent. */
  digit: number;
};

const forceCallup = () => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('at23') === '1';
};

/**
 * The station's transmitter. Steps through today's groups, flashing each digit, and switches to the
 * call-up for the 23rd minute of every hour. `step` is driven by the portal's animation loop;
 * the readout subscribes to group and digit changes.
 */
export class StationBroadcast {
  blink = 0;

  lock = 0;

  private seq: FlashSequence | null = null;

  private started = 0;

  private state: BroadcastState;

  private listeners = new Set<(s: BroadcastState) => void>();

  constructor() {
    const mode = this.wantMode();
    this.state = { mode, groups: this.groupsFor(mode), index: 0, digit: 0 };
  }

  private wantMode(): BroadcastMode {
    return forceCallup() || new Date().getMinutes() === 23 ? 'callup' : 'pool';
  }

  private groupsFor(mode: BroadcastMode) {
    const s = scheduleFor();
    return mode === 'callup' ? s.callup : s.pool;
  }

  get current() {
    return this.state;
  }

  subscribe(fn: (s: BroadcastState) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit(next: BroadcastState) {
    this.state = next;
    this.listeners.forEach((fn) => fn(next));
  }

  /** Advance to time `now` (seconds). Returns the light level, 0..1. */
  step(now: number) {
    let { mode, groups, index } = this.state;
    if (!this.seq) {
      this.seq = flashSequence(groups[index]);
      this.started = now;
    }
    let elapsed = now - this.started;
    if (elapsed > this.seq.total) {
      const wanted = this.wantMode();
      if (wanted !== mode) {
        mode = wanted;
        groups = this.groupsFor(mode);
        index = 0;
      } else {
        index = (index + 1) % groups.length;
      }
      this.seq = flashSequence(groups[index]);
      this.started = now;
      elapsed = 0;
    }

    const on = this.seq.flashes.some(([a, b]) => elapsed >= a && elapsed < b);
    let digit = 0;
    this.seq.digitStarts.forEach((start, i) => {
      if (elapsed >= start) digit = i;
    });
    if (elapsed >= this.seq.end) digit = groups[index].length;

    this.blink += ((on ? 1 : 0) - this.blink) * (on ? 0.75 : 0.4);
    this.lock += ((mode === 'callup' ? 1 : 0) - this.lock) * 0.03;

    const s = this.state;
    if (s.mode !== mode || s.groups !== groups || s.index !== index || s.digit !== digit) {
      this.emit({ mode, groups, index, digit });
    }
    return this.blink;
  }
}

export const useBroadcastState = (broadcast: StationBroadcast) => {
  const [state, setState] = useState(broadcast.current);
  useEffect(() => broadcast.subscribe(setState), [broadcast]);
  return state;
};
