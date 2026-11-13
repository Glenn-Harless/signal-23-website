import React, { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ReleaseTelemetry } from '../../data/releases';
import { Rgb } from '../Station/sky';

interface SpectrumWindowProps {
  telemetry: ReleaseTelemetry | null;
  palette: [Rgb, Rgb, Rgb];
  seedKey: string;
  to: string;
  label: string;
}

// A small portal per release: its measured spectrum (low frequencies left, the track running top to
// bottom) drawn as feathered light in the visitor's sky colours. Hovering shows the data as lines.
export const SpectrumWindow: React.FC<SpectrumWindowProps> = ({ telemetry, palette, seedKey, to, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const W = cv.width;
    const H = cv.height;
    const NW = 48;
    const NH = 24;
    const off = document.createElement('canvas');
    off.width = NW;
    off.height = NH;
    const octx = off.getContext('2d');
    if (!octx) return;
    const img = octx.createImageData(NW, NH);
    const { data } = img;
    let seed = 0;
    for (let s = 0; s < seedKey.length; s += 1) seed += seedKey.charCodeAt(s) * (s + 1);
    for (let y = 0; y < NH; y += 1) {
      for (let x = 0; x < NW; x += 1) {
        const u = x / (NW - 1);
        const v = y / (NH - 1);
        const raw = telemetry
          ? telemetry.spectrum[y][x] / 99
          : ((((Math.sin((x + seed) * 12.9898 + (y + seed) * 78.233) * 43758.5453) % 1) + 1) % 1) * 0.22;
        const val = Math.max(0, raw) ** 1.5;
        const ex = Math.min(1, Math.min(u, 1 - u) / 0.16);
        const ey = Math.min(1, Math.min(v, 1 - v) / 0.12);
        const edge = ex * ex * (3 - 2 * ex) * ey * ey * (3 - 2 * ey);
        const lo = val < 0.5;
        const f = lo ? val / 0.5 : (val - 0.5) / 0.5;
        const A = lo ? palette[0] : palette[1];
        const B = lo ? palette[1] : palette[2];
        const i4 = (y * NW + x) * 4;
        data[i4] = A[0] + (B[0] - A[0]) * f;
        data[i4 + 1] = A[1] + (B[1] - A[1]) * f;
        data[i4 + 2] = A[2] + (B[2] - A[2]) * f;
        data[i4 + 3] = 255 * edge * Math.min(1, val * 1.7 + (telemetry ? 0.06 : 0.02));
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.filter = `blur(${Math.round(W * 0.07)}px)`;
    ctx.globalAlpha = 0.38;
    ctx.drawImage(off, -W * 0.06, -H * 0.04, W * 1.12, H * 1.08);
    ctx.filter = `blur(${Math.max(2, Math.round(W * 0.008))}px)`;
    ctx.globalAlpha = 1;
    ctx.drawImage(off, W * 0.08, H * 0.06, W * 0.84, H * 0.88);
    ctx.filter = 'none';
  }, [telemetry, palette, seedKey]);

  const paths = useMemo(
    () =>
      telemetry
        ? telemetry.spectrum.map((row, i) => {
          const base = 40 + i * 14.4;
          return row.reduce((d, v, j) => `${d} L${(24 + (j / (row.length - 1)) * 252).toFixed(1)} ${(base - v * 0.3).toFixed(1)}`, `M24 ${base.toFixed(1)}`);
        })
        : [],
    [telemetry],
  );

  return (
    <Link className="av-win" to={to} aria-label={label}>
      <canvas ref={canvasRef} width={360} height={480} aria-hidden="true" />
      {paths.length > 0 && (
        <svg viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true">
          {paths.map((d, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <path key={i} d={d} />
          ))}
        </svg>
      )}
    </Link>
  );
};
