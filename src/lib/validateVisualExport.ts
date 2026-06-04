import type { ExportTarget, VisualExportCapability } from '../data/transmissions';

const VALID_TARGETS: ExportTarget[] = ['canvas', 'reel', 'hardware-feed', 'still', 'loop'];

export function validateVisualExport(capability: VisualExportCapability): string[] {
  const errors: string[] = [];

  if (!capability.supportedTargets.includes(capability.defaultTarget)) {
    errors.push(`defaultTarget "${capability.defaultTarget}" is not in supportedTargets`);
  }

  if (!capability.aspectRatios.supported.includes(capability.aspectRatios.default)) {
    errors.push(`aspectRatios.default "${capability.aspectRatios.default}" is not in aspectRatios.supported`);
  }

  const { defaultSeconds, minSeconds, maxSeconds } = capability.duration;

  if (
    typeof minSeconds === 'number' &&
    typeof maxSeconds === 'number' &&
    minSeconds > maxSeconds
  ) {
    errors.push(`duration.minSeconds ${minSeconds} is greater than duration.maxSeconds ${maxSeconds}`);
  }

  if (typeof defaultSeconds === 'number') {
    if (typeof minSeconds === 'number' && defaultSeconds < minSeconds) {
      errors.push(`duration.defaultSeconds ${defaultSeconds} is less than duration.minSeconds ${minSeconds}`);
    }

    if (typeof maxSeconds === 'number' && defaultSeconds > maxSeconds) {
      errors.push(`duration.defaultSeconds ${defaultSeconds} is greater than duration.maxSeconds ${maxSeconds}`);
    }
  }

  for (const target of capability.supportedTargets) {
    if (!VALID_TARGETS.includes(target)) {
      errors.push(`unsupported export target "${target}"`);
    }
  }

  return errors;
}
