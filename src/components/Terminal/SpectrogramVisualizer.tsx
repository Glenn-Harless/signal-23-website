import React, { useEffect, useMemo, useRef } from 'react';
import { audioStreamer } from './AudioStreamer';

interface SpectrogramVisualizerProps {
  isActive: boolean;
  frequencyLabel: string | null;
  variant?: 'default' | 'compact';
}

const CANVAS_WIDTH = 280;
const CANVAS_HEIGHT_DEFAULT = 160;
const CANVAS_HEIGHT_COMPACT = 128;

const FALLBACK_MESSAGE = 'AUDIO ANALYSIS UNAVAILABLE';

type AnimationFrameId = number | undefined;

export const SpectrogramVisualizer: React.FC<SpectrogramVisualizerProps> = ({
  isActive,
  frequencyLabel,
  variant = 'default',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<AnimationFrameId>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const sourceElementRef = useRef<HTMLMediaElement | null>(null);
  const historyRef = useRef<Uint8Array[]>([]);

  const supportsAudioAnalysis = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return Boolean(window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const cleanupAudioGraph = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      try {
        sourceRef.current?.disconnect();
      } catch (_error) {
        // Ignore disconnect errors when tearing down
      }
      try {
        analyserRef.current?.disconnect();
      } catch (_error) {
        // Ignore disconnect errors when tearing down
      }
      historyRef.current = [];

      const existingContext = audioContextRef.current;
      audioContextRef.current = null;
      if (existingContext && existingContext.state !== 'closed') {
        existingContext.close().catch(() => {
          // Ignore close errors
        });
      }

      analyserRef.current = null;
      sourceRef.current = null;
      sourceElementRef.current = null;
    };

    if (!isActive || !supportsAudioAnalysis) {
      cleanupAudioGraph();
      return () => {
        isMounted = false;
        cleanupAudioGraph();
      };
    }

    const AudioContextConstructor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) {
      return () => {
        isMounted = false;
        cleanupAudioGraph();
      };
    }

    const connectToAudio = async () => {
      let audioContext = audioContextRef.current;
      if (!audioContext) {
        audioContext = new AudioContextConstructor();
        audioContextRef.current = audioContext;
      }

      if (audioContext.state === 'suspended') {
        try {
          await audioContext.resume();
        } catch (_error) {
          // Ignore resume errors (can happen if user gesture not detected yet)
        }
      }

      const audioElement = audioStreamer.getAudioElement();
      if (!audioElement) {
        if (isMounted) {
          animationFrameRef.current = requestAnimationFrame(connectToAudio);
        }
        return;
      }

      if (!sourceRef.current || sourceElementRef.current !== audioElement) {
        try {
          sourceRef.current?.disconnect();
        } catch (_error) {
          // Ignore disconnect errors
        }

        try {
          sourceRef.current = audioContext.createMediaElementSource(audioElement);
          sourceElementRef.current = audioElement;
        } catch (error) {
          if (!sourceRef.current) {
            // eslint-disable-next-line no-console
            console.error('Unable to initialize spectrogram audio source', error);
            return;
          }
        }
      }

      if (sourceRef.current && analyserRef.current) {
        try {
          sourceRef.current.connect(analyserRef.current);
        } catch (_error) {
          // Ignore repeated connections
        }
      }

      if (!analyserRef.current && audioContext) {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.78;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        analyserRef.current = analyser;

        try {
          analyser.connect(audioContext.destination);
        } catch (_error) {
          // Destination might already be connected; ignore duplicate errors
        }

        if (sourceRef.current) {
          try {
            sourceRef.current.connect(analyser);
          } catch (_error) {
            // Ignore duplicate connection attempts
          }
        }
      }

      if (!analyserRef.current) {
        return;
      }

      const render = () => {
        if (!isMounted || !isActive) {
          return;
        }

        const analyser = analyserRef.current;
        const canvas = canvasRef.current;
        if (!analyser || !canvas) {
          animationFrameRef.current = requestAnimationFrame(render);
          return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
          animationFrameRef.current = requestAnimationFrame(render);
          return;
        }

        const frequencyBins = analyser.frequencyBinCount;
        const frequencyData = new Uint8Array(frequencyBins);
        analyser.getByteFrequencyData(frequencyData);

        historyRef.current.push(frequencyData);
        const maxColumns = canvas.width;
        if (historyRef.current.length > maxColumns) {
          historyRef.current.splice(0, historyRef.current.length - maxColumns);
        }

        context.clearRect(0, 0, canvas.width, canvas.height);

        const columnCount = historyRef.current.length;
        for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
          const column = historyRef.current[columnCount - 1 - columnIndex];
          for (let y = 0; y < canvas.height; y += 1) {
            const dataIndex = Math.min(column.length - 1, Math.floor((y / canvas.height) * column.length));
            const value = column[dataIndex];
            const intensity = value / 255;
            const hue = 260 - intensity * 220;
            const lightness = 12 + intensity * 45;
            const alpha = Math.max(0.25, intensity * 0.95);

            context.fillStyle = `hsla(${hue}, 95%, ${lightness}%, ${alpha})`;
            context.fillRect(canvas.width - columnIndex - 1, canvas.height - y - 1, 1, 1);
          }
        }

        animationFrameRef.current = requestAnimationFrame(render);
      };

      render();
    };

    connectToAudio();

    return () => {
      isMounted = false;
      cleanupAudioGraph();
    };
  }, [isActive, supportsAudioAnalysis]);

  return (
    <div
      className={`pointer-events-none transition-all duration-500 ease-out ${
        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="rounded-lg border border-green-500/40 bg-black shadow-[0_0_24px_rgba(56,255,148,0.12)] overflow-hidden">
        <div className="px-4 pt-3 pb-2 text-xs tracking-widest text-green-300/80 font-ibm-mono">
          {isActive
            ? `SCAN VISUAL • ${frequencyLabel ?? 'FREQ-???.?'}`
            : 'SCAN VISUAL IDLE'}
        </div>
        {supportsAudioAnalysis ? (
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={variant === 'compact' ? CANVAS_HEIGHT_COMPACT : CANVAS_HEIGHT_DEFAULT}
            className={`w-full ${variant === 'compact' ? 'h-32' : 'h-40'}`}
          />
        ) : (
          <div
            className={`flex ${variant === 'compact' ? 'h-32' : 'h-40'} items-center justify-center text-[0.65rem] tracking-[0.3rem] text-green-200/60`}
          >
            {FALLBACK_MESSAGE}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpectrogramVisualizer;
