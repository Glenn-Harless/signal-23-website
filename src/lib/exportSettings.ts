import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ExportTarget, VisualExportCapability } from '../data/transmissions';

export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export type ExportSettings = {
  isExportMode: boolean;
  target: ExportTarget;
  requestedTarget: ExportTarget | null;
  fellBackToDefault: boolean;
  seed: string | null;
  duration: number | null;
  aspect: AspectRatio;
};

const VALID_TARGETS: ExportTarget[] = ['canvas', 'reel', 'hardware-feed', 'still', 'loop'];
const VALID_ASPECTS: AspectRatio[] = ['9:16', '16:9', '1:1', '4:5'];

const isExportTarget = (value: string | null): value is ExportTarget =>
  value !== null && VALID_TARGETS.includes(value as ExportTarget);

const isAspectRatio = (value: string | null): value is AspectRatio =>
  value !== null && VALID_ASPECTS.includes(value as AspectRatio);

const getRoutePath = () => {
  if (typeof window === 'undefined') {
    return 'unknown route';
  }

  return window.location.pathname;
};

const resolveDuration = (
  value: string | null,
  capability: VisualExportCapability,
) => {
  if (!value || !capability.duration.supported) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const { minSeconds, maxSeconds } = capability.duration;
  if (typeof minSeconds === 'number' && typeof maxSeconds === 'number') {
    return Math.min(Math.max(parsed, minSeconds), maxSeconds);
  }

  return parsed;
};

export function resolveSettings(
  params: URLSearchParams,
  capability: VisualExportCapability,
): ExportSettings {
  const rawTarget = params.get('target');
  const isExportMode = params.has('target');
  const requestedTarget = isExportTarget(rawTarget) ? rawTarget : null;
  const targetIsSupported = requestedTarget !== null && capability.supportedTargets.includes(requestedTarget);
  const fellBackToDefault = isExportMode && !targetIsSupported;
  const target = targetIsSupported ? requestedTarget : capability.defaultTarget;

  const rawAspect = params.get('aspect');
  const aspect = isAspectRatio(rawAspect) && capability.aspectRatios.supported.includes(rawAspect)
    ? rawAspect
    : capability.aspectRatios.default;

  return {
    isExportMode,
    target,
    requestedTarget,
    fellBackToDefault,
    seed: params.get('seed'),
    duration: resolveDuration(params.get('duration'), capability),
    aspect,
  };
}

export function useExportSettings(capability: VisualExportCapability): ExportSettings {
  const [params] = useSearchParams();
  const settings = useMemo(() => resolveSettings(params, capability), [params, capability]);

  useEffect(() => {
    if (!settings.fellBackToDefault) {
      return;
    }

    console.warn(
      `[visual-export] ${getRoutePath()} unsupported target: ${params.get('target') ?? 'empty'}; falling back to ${settings.target}`,
    );
  }, [params, settings.fellBackToDefault, settings.target]);

  return settings;
}
