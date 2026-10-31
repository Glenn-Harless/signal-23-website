// One AudioContext for the site and one analyser per audio element.
// A media element can only be connected to Web Audio once, so every caller goes through here.

let context: AudioContext | null = null;
const analysers = new WeakMap<HTMLMediaElement, AnalyserNode>();

const getContext = () => {
  if (context) return context;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  context = new Ctx();
  return context;
};

/** Returns an analyser wired between the element and the speakers, or null if Web Audio is unavailable. */
export const analyserFor = (element: HTMLMediaElement, fftSize = 1024): AnalyserNode | null => {
  const existing = analysers.get(element);
  if (existing) return existing;
  const ctx = getContext();
  if (!ctx) return null;
  try {
    const source = ctx.createMediaElementSource(element);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analysers.set(element, analyser);
    return analyser;
  } catch {
    return null;
  }
};

/** Browsers start audio contexts suspended until a user gesture; call from a click handler. */
export const resumeAudio = () => {
  const ctx = getContext();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => undefined);
};

/** Mean level of the bins from `from` to `to`, 0..1. */
export const bandLevel = (analyser: AnalyserNode, buffer: Uint8Array, from: number, to: number) => {
  analyser.getByteFrequencyData(buffer);
  let sum = 0;
  const end = Math.min(to, buffer.length);
  for (let i = from; i < end; i += 1) sum += buffer[i];
  return sum / ((end - from) * 255);
};
