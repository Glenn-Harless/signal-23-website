import React, { useEffect, useRef } from 'react';
import { DETAIL_FRAGMENT, PORTAL_VERTEX } from './portalShaders';
import { localHour, nightAmount, skyPalette } from './sky';
import { StationBroadcast } from './broadcast';

interface StationPortalProps {
  broadcast: StationBroadcast;
  onEnter: () => void;
}

const FRAME_MS = 33;

type GlState = {
  gl: WebGLRenderingContext;
  u: Record<string, WebGLUniformLocation | null>;
};

const UNIFORMS = ['uRes', 'uTime', 'uMouse', 'uShadow', 'uMid', 'uHigh', 'uWin', 'uNight'];

const initGl = (canvas: HTMLCanvasElement): GlState | null => {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = compile(gl.VERTEX_SHADER, PORTAL_VERTEX);
  const fs = compile(gl.FRAGMENT_SHADER, DETAIL_FRAGMENT);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u: GlState['u'] = {};
  UNIFORMS.forEach((n) => {
    u[n] = gl.getUniformLocation(prog, n);
  });
  return { gl, u };
};

// Without WebGL: the soft cloud drawn small on the CPU and blurred up.
const hash2 = (i: number, j: number) => {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const noise2 = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
const fbm2 = (x: number, y: number) => {
  let s = 0;
  let a = 0.5;
  for (let o = 0; o < 4; o += 1) {
    s += a * noise2(x, y);
    x *= 2.03;
    y *= 2.03;
    a *= 0.5;
  }
  return s;
};

class CpuCloud {
  private off = document.createElement('canvas');

  private offCtx: CanvasRenderingContext2D | null;

  private img: ImageData | null;

  constructor(private nw = 72, private nh = 94) {
    this.off.width = nw;
    this.off.height = nh;
    this.offCtx = this.off.getContext('2d');
    this.img = this.offCtx ? this.offCtx.createImageData(nw, nh) : null;
  }

  draw(ctx: CanvasRenderingContext2D, W: number, H: number, win: DOMRect, t: number, mouse: [number, number], h: number) {
    if (!this.offCtx || !this.img) return;
    const { nw, nh } = this;
    const data = this.img.data;
    const pal = skyPalette(h);
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (nightAmount(h) > 0.5) {
      ctx.fillStyle = 'rgba(191,233,245,0.35)';
      for (let s = 0; s < 46; s += 1) {
        const sx = (Math.sin(s * 91.7) * 0.5 + 0.5) * W;
        const sy = (Math.sin(s * 47.3) * 0.5 + 0.5) * H * 0.82;
        if (sx > win.left - 60 && sx < win.right + 60 && sy > win.top - 60 && sy < win.bottom + 60) continue;
        ctx.fillRect(sx, sy, 1, 1);
      }
    }
    const ox = mouse[0] * 0.25;
    const oy = mouse[1] * 0.25;
    for (let y = 0; y < nh; y += 1) {
      for (let x = 0; x < nw; x += 1) {
        const u = x / (nw - 1);
        const v = y / (nh - 1);
        const n = fbm2(u * 2.6 + t * 0.035 + ox, v * 3.4 + t * 0.02 + oy);
        const w = fbm2(u * 2.0 + n * 1.6 - t * 0.012, v * 2.2 + n * 1.2 + t * 0.016);
        const ex = Math.min(1, Math.min(u, 1 - u) / 0.12);
        const ey = Math.min(1, Math.min(v, 1 - v) / 0.09);
        const edge = ex * ex * (3 - 2 * ex) * ey * ey * (3 - 2 * ey);
        const dx = u - 0.5;
        const dy = (v - 0.5) * 1.3;
        const r = Math.sqrt(dx * dx + dy * dy);
        const val = Math.max(0, Math.min(1, w * 1.25 - 0.1 + 0.05 * Math.sin(r * 38 - t * 1.1) * Math.exp(-r * 3) + Math.exp(-r * r * 7) * 0.22));
        const lo = val < 0.5;
        const f = lo ? val / 0.5 : (val - 0.5) / 0.5;
        const A = lo ? pal[0] : pal[1];
        const B = lo ? pal[1] : pal[2];
        const i4 = (y * nw + x) * 4;
        data[i4] = A[0] + (B[0] - A[0]) * f;
        data[i4 + 1] = A[1] + (B[1] - A[1]) * f;
        data[i4 + 2] = A[2] + (B[2] - A[2]) * f;
        data[i4 + 3] = 255 * edge * Math.min(1, val * 1.6 + 0.15);
      }
    }
    this.offCtx.putImageData(this.img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    const spread = win.width * 0.15;
    ctx.filter = `blur(${Math.round(win.width * 0.1)}px)`;
    ctx.globalAlpha = 0.32;
    ctx.drawImage(this.off, win.left - spread, win.top - spread * 1.17, win.width + spread * 2, win.height + spread * 2.34);
    ctx.filter = 'blur(4px)';
    ctx.globalAlpha = 1;
    ctx.drawImage(this.off, win.left, win.top, win.width, win.height);
    ctx.filter = 'none';
  }
}

export const StationPortal: React.FC<StationPortalProps> = ({ broadcast, onEnter }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const win = windowRef.current;
    if (!canvas || !win) return undefined;

    let glState = initGl(canvas);
    let ctx2d: CanvasRenderingContext2D | null = null;
    let cpuCloud: CpuCloud | null = null;
    if (!glState) {
      ctx2d = canvas.getContext('2d');
      cpuCloud = new CpuCloud();
    }

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.tx = e.clientX / window.innerWidth - 0.5;
      mouse.ty = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('mousemove', onMove);

    let raf = 0;
    let last = 0;
    const t0 = performance.now();

    const frame = (ts: number) => {
      raf = requestAnimationFrame(frame);
      if (ts - last < FRAME_MS) return;
      last = ts;
      const t = (ts - t0) / 1000;
      broadcast.step(t);

      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      const cr = canvas.getBoundingClientRect();
      const wr = win.getBoundingClientRect();
      const rect = new DOMRect(wr.left - cr.left, wr.top - cr.top, wr.width, wr.height);
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      const h = localHour();

      if (!glState) {
        if (ctx2d && cpuCloud) cpuCloud.draw(ctx2d, W, H, rect, t, [mouse.x, mouse.y], h);
        return;
      }

      const { gl, u } = glState;
      const [sh, mi, hi] = skyPalette(h).map((c) => c.map((v) => v / 255));
      const night = nightAmount(h);
      gl.viewport(0, 0, W, H);
      gl.uniform2f(u.uRes, W, H);
      gl.uniform4f(u.uWin, rect.left, rect.top, rect.width, rect.height);
      gl.uniform1f(u.uTime, t);
      gl.uniform2f(u.uMouse, mouse.x, mouse.y);
      gl.uniform3f(u.uShadow, sh[0], sh[1], sh[2]);
      gl.uniform3f(u.uMid, mi[0], mi[1], mi[2]);
      gl.uniform3f(u.uHigh, hi[0], hi[1], hi[2]);
      gl.uniform1f(u.uNight, night);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      if (glState) {
        glState.gl.getExtension('WEBGL_lose_context')?.loseContext();
        glState = null;
      }
    };
  }, [broadcast]);

  return (
    <div className="station-portal">
      <canvas ref={canvasRef} className="station-portal__canvas" aria-hidden="true" />
      <div ref={windowRef} className="station-portal__window">
        <button type="button" className="station-portal__enter" aria-label="Enter terminal" onClick={onEnter} />
      </div>
    </div>
  );
};
