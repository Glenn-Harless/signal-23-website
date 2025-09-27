import { useCallback, useEffect, useMemo, useState } from 'react';

const AUDIO_READY_EVENT = 'audio:ready';
const AUDIO_STATE_EVENT = 'audio:state';

type AudioContextState = {
  isPlaying: boolean;
};

const defaultState: AudioContextState = {
  isPlaying: false,
};

export function useAudio() {
  const [state, setState] = useState<AudioContextState>(defaultState);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handler = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const detail = event.detail as AudioContextState;
      setState(detail);
    };

    window.addEventListener(AUDIO_STATE_EVENT, handler as EventListener);

    return () => window.removeEventListener(AUDIO_STATE_EVENT, handler as EventListener);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const readyHandler = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const element = event.detail as HTMLAudioElement;
      setAudioElement(element);
    };

    window.addEventListener(AUDIO_READY_EVENT, readyHandler as EventListener);

    return () => window.removeEventListener(AUDIO_READY_EVENT, readyHandler as EventListener);
  }, []);

  const togglePlayback = useCallback(() => {
    if (!audioElement) {
      return;
    }

    if (state.isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play().catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Audio playback failed', error);
      });
    }
  }, [audioElement, state.isPlaying]);

  const controls = useMemo(
    () => ({
      isPlaying: state.isPlaying,
      togglePlayback,
      audioElement,
    }),
    [audioElement, state.isPlaying, togglePlayback],
  );

  return controls;
}

export function registerAudioElement(element: HTMLAudioElement) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const notifyReady = new CustomEvent(AUDIO_READY_EVENT, { detail: element });
  window.dispatchEvent(notifyReady);

  const updateState = () => {
    const stateEvent = new CustomEvent<AudioContextState>(AUDIO_STATE_EVENT, {
      detail: { isPlaying: !element.paused },
    });
    window.dispatchEvent(stateEvent);
  };

  element.addEventListener('play', updateState);
  element.addEventListener('pause', updateState);
  element.addEventListener('ended', updateState);

  updateState();

  return () => {
    element.removeEventListener('play', updateState);
    element.removeEventListener('pause', updateState);
    element.removeEventListener('ended', updateState);
  };
}
