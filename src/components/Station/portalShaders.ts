// Fragment shaders for the home portal, ported from the Station Concepts design canvas.
// Both draw the whole screen with one triangle: stars outside the window, a halo around it, and the
// heavy work only inside the window rectangle (uWin, in canvas pixels, top-left origin).

export const PORTAL_VERTEX = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';

// Option B: detailed cloud. Domain-warped fbm in three parallax slices with self-shadowing.
export const DETAIL_FRAGMENT = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform vec3 uShadow; uniform vec3 uMid; uniform vec3 uHigh; uniform vec4 uWin; uniform float uNight;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
const mat2 M = mat2(1.6, 1.2, -1.2, 1.6);
float fbm5(vec2 p){ float s = 0.0; float a = 0.5; for (int i = 0; i < 5; i++){ s += a * noise(p); p = M * p; a *= 0.5; } return s; }
float fbm3(vec2 p){ float s = 0.0; float a = 0.5; for (int i = 0; i < 3; i++){ s += a * noise(p); p = M * p; a *= 0.5; } return s; }
float ridged(vec2 p){ float s = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ float n = 1.0 - abs(noise(p) * 2.0 - 1.0); s += a * n * n; p = M * p; a *= 0.5; } return s; }
vec3 pal(float v){ v = clamp(v, 0.0, 1.0); return v < 0.5 ? mix(uShadow, uMid, v * 2.0) : mix(uMid, uHigh, (v - 0.5) * 2.0); }
void main(){
  vec2 fc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 w = (fc - uWin.xy) / uWin.zw;
  float t = uTime;
  vec2 o2 = max(max(-w, w - 1.0), 0.0);
  float od = length(o2 * uWin.zw);
  float grain = (hash(fc + fract(t * 7.0) * 97.0) - 0.5) * 0.045;
  if (od > 150.0) {
    float st = step(0.9986, hash(floor(fc / 2.0))) * uNight * (0.5 + 0.5 * sin(t * 1.3 + hash(floor(fc / 2.0) + 3.0) * 40.0));
    gl_FragColor = vec4(vec3(max(grain, 0.0) * 0.35) + uHigh * st * 0.35, 1.0); return;
  }
  vec2 p = w * vec2(2.4, 3.1);
  vec2 q = vec2(fbm3(p + vec2(0.0, t * 0.04)), fbm3(p + vec2(5.2, 1.3) - t * 0.035));
  vec2 r = vec2(fbm3(p + 2.6 * q + vec2(1.7, 9.2) + t * 0.025), fbm3(p + 2.6 * q + vec2(8.3, 2.8) - t * 0.02));
  float halo = fbm3(p * 0.6 + r) * exp(-od / 55.0) * 0.5;
  vec3 haloCol = pal(halo * 0.9) * halo * 1.4;
  if (od > 0.0) { gl_FragColor = vec4(haloCol + grain * 0.5, 1.0); return; }
  vec2 L = vec2(-0.021, -0.028);
  float acc = 0.0; vec3 colAcc = vec3(0.0);
  for (int s = 0; s < 3; s++) {
    float z = float(s);
    vec2 ps = p + uMouse * (0.05 + 0.06 * z) + vec2(z * 1.7, z * 0.9);
    vec2 drift = vec2(0.0, t * 0.015 * (1.0 + z));
    float d = fbm5(ps + 2.2 * r + z * 0.3 - drift);
    float dl = fbm5(ps + 2.2 * r + z * 0.3 - drift + L);
    d += 0.16 * ridged(ps * 2.6 + r * 2.0 + t * 0.02);
    float a = smoothstep(0.40, 0.86, d) * (0.55 + 0.22 * z);
    float lit = clamp(0.55 + (d - dl) * 7.0, 0.0, 1.0);
    vec3 c = pal(d * 0.8 + lit * 0.38);
    colAcc = colAcc * (1.0 - a) + c * a; acc = acc * (1.0 - a) + a;
  }
  vec2 lp = vec2(0.5 + 0.22 * sin(t * 0.13), 0.45 + 0.25 * sin(t * 0.09 + 1.3));
  float ld = length((w - lp) * vec2(1.0, 1.3));
  float inner = exp(-ld * 5.0) * (0.55 + 0.45 * sin(t * 0.6)) * 0.4;
  vec2 cdv = (w - 0.5) * vec2(1.0, 1.3); float rr = length(cdv);
  float ripple = 0.035 * sin(rr * 38.0 - t * 1.1) * exp(-rr * 3.0);
  float core = exp(-rr * rr * 7.0) * 0.16;
  float e1 = min(min(w.x, 1.0 - w.x) / 0.10, min(w.y, 1.0 - w.y) / 0.08);
  float erode = fbm3(w * vec2(16.0, 20.0) + t * 0.02);
  float edge = smoothstep(0.0, 1.0, e1 - erode * 0.55 + 0.25);
  vec3 col = colAcc + pal(0.9) * (inner * (0.35 + acc) + core) + vec3(ripple) * 0.6;
  vec2 g = w * vec2(26.0, 34.0) + vec2(0.0, t * 0.35); vec2 gi = floor(g); vec2 gf = fract(g) - 0.5;
  float h = hash(gi); vec2 off = vec2(hash(gi + 3.1), hash(gi + 7.7)) - 0.5;
  float mote = h > 0.93 ? (1.0 - smoothstep(0.0, 0.08, length(gf - off * 0.6))) * (0.5 + 0.5 * sin(t * 2.0 + h * 40.0)) : 0.0;
  col += pal(1.0) * mote * 0.55;
  col *= 0.95 + 0.05 * sin(fc.y * 3.14159);
  col = col * edge + haloCol * (1.0 - edge) + grain;
  gl_FragColor = vec4(col, 1.0);
}
`;

// Option C: Station 23, received. A slow-scan picture of seven release ridges and a mast,
// rebuilt line by line every 23 seconds, with live fog and the mast light on top.
export const STATION_FRAGMENT = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform vec3 uShadow; uniform vec3 uMid; uniform vec3 uHigh; uniform vec4 uWin;
uniform float uNight; uniform vec3 uSun; uniform vec4 uMoon; uniform vec3 uLight; uniform float uBlink; uniform float uFog; uniform float uMastU; uniform float uLock;
uniform sampler2D uRidge;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
const mat2 M = mat2(1.6, 1.2, -1.2, 1.6);
float fbm5(vec2 p){ float s = 0.0; float a = 0.5; for (int i = 0; i < 5; i++){ s += a * noise(p); p = M * p; a *= 0.5; } return s; }
float fbm3(vec2 p){ float s = 0.0; float a = 0.5; for (int i = 0; i < 3; i++){ s += a * noise(p); p = M * p; a *= 0.5; } return s; }
float ridged(vec2 p){ float s = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ float n = 1.0 - abs(noise(p) * 2.0 - 1.0); s += a * n * n; p = M * p; a *= 0.5; } return s; }
vec3 pal(float v){ v = clamp(v, 0.0, 1.0); return v < 0.5 ? mix(uShadow, uMid, v * 2.0) : mix(uMid, uHigh, (v - 0.5) * 2.0); }
float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float prof(float k, float u){ return texture2D(uRidge, vec2(u, (k + 0.5) / 8.0)).r; }
float topY(float k, float x){
  float f = k / 6.0;
  float u = (x - 0.5) * mix(1.04, 0.92, f) + 0.5 - 0.16 * f;
  float crag = noise(vec2(u * mix(26.0, 70.0, f), k * 7.3)) * 0.6 + noise(vec2(u * mix(70.0, 190.0, f), k * 3.1 + 11.0)) * 0.4;
  return mix(0.545, 0.90, pow(f, 1.25)) - mix(0.045, 0.22, f) * (prof(k, u) * 0.86 + crag * mix(0.06, 0.16, f));
}
float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a; vec2 ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
vec3 scene(vec2 w, float T){
  float day = 1.0 - uNight;
  vec2 P = w * uWin.zw;
  float hz = 0.53;
  float sy = clamp(w.y / hz, 0.0, 1.0);
  vec3 col = pal(mix(0.07, 0.58, day) + sy * sy * mix(0.14, 0.24, day));
  vec2 sp = vec2(uSun.x, hz - uSun.y * 0.42);
  col += pal(1.0) * exp(-length((w - sp) * vec2(1.0, 2.2)) * 2.4) * uSun.z * 0.6;
  vec2 sc = P / 3.0 - vec2(T * 0.014, 0.0); vec2 sf = fract(sc) - 0.5;
  float sh = hash(floor(sc) + 11.0);
  float star = sh > 0.992 ? 1.0 - smoothstep(0.08, 0.42, length(sf)) : 0.0;
  col += uHigh * star * uNight * (1.0 - smoothstep(hz - 0.3, hz, w.y)) * 0.9;
  if (uMoon.z > 0.0) {
    vec2 md = P - uMoon.xy * uWin.zw; float mr = uMoon.z; float dd = length(md);
    if (dd < mr + 90.0) {
      float disc = 1.0 - smoothstep(mr - 0.8, mr + 0.6, dd);
      vec2 mu = md / mr;
      float lim = sqrt(max(1.0 - mu.y * mu.y, 0.0));
      float term = cos(6.2831853 * uMoon.w) * lim;
      float litm = uMoon.w < 0.5 ? smoothstep(term - 0.08, term + 0.08, mu.x) : 1.0 - smoothstep(-term - 0.08, -term + 0.08, mu.x);
      vec3 mc = mix(pal(0.16) * 0.7, pal(0.97 - fbm3(mu * 2.3 + vec2(4.0, 1.0)) * 0.3), litm);
      float mg = exp(-max(dd - mr, 0.0) / 34.0) * (1.0 - disc) * 0.22 * (0.5 - 0.5 * cos(6.2831853 * uMoon.w));
      col = mix(col, mc, disc * uNight) + uHigh * mg * uNight;
    }
  }
  float side = uLight.x < 0.0 ? -1.0 : 1.0;
  vec3 lightCol = mix(uHigh * 0.6, pal(1.0), day);
  vec3 fogCol = pal(mix(0.26, 0.78, day));
  vec3 skyH = pal(mix(0.16, 0.80, day));
  float aa = 0.8 / uWin.w;
  vec3 land = vec3(0.0); float la = 0.0;
  for (int i = 0; i < 7; i++) {
    float k = 6.0 - float(i); float f = k / 6.0;
    float ty = topY(k, w.x);
    if (w.y < ty - aa) continue;
    float sl = (topY(k, w.x + 0.006) - ty) / 0.006;
    float a = smoothstep(ty - aa, ty + aa, w.y);
    vec3 rc = pal(mix(0.015, 0.07, day) + 0.04 * f) * (0.9 + 0.2 * noise(w * vec2(110.0, 80.0) + k * 9.0) * f);
    rc = mix(rc, skyH, pow(1.0 - f, 1.3) * mix(0.5, 0.78, day));
    float dpx = (w.y - ty) * uWin.w;
    rc += lightCol * exp(-dpx / mix(1.6, 4.5, f)) * (0.2 + clamp(sl * side * 1.2, 0.0, 1.0)) * uLight.z * (0.35 + 0.65 * f) * 0.5;
    float fdn = fbm3(vec2(w.x * 3.2 + k * 2.3 - T * 0.012 * (1.0 + f), w.y * 7.0 + k * 1.7));
    float valley = smoothstep(0.0, mix(0.05, 0.15, f), w.y - ty) * (0.3 + 0.7 * fdn) * uFog;
    rc = mix(rc, fogCol, clamp(valley * mix(0.92, 0.62, f), 0.0, 1.0));
    land += (1.0 - la) * a * rc; la += (1.0 - la) * a;
    if (la > 0.995) break;
  }
  col = col * (1.0 - la) + land;
  vec2 mf = vec2((uMastU - 0.34) / 0.92 + 0.5, 0.90 - 0.22 * 0.86 * prof(6.0, uMastU)) * uWin.zw;
  float H = 76.0;
  float hy = mf.y - P.y; float ax = abs(P.x - mf.x);
  if (hy > -8.0 && hy < H + 4.0 && ax < 44.0) {
    float body = (1.0 - smoothstep(mix(2.4, 0.55, clamp(hy / H, 0.0, 1.0)) - 0.5, mix(2.4, 0.55, clamp(hy / H, 0.0, 1.0)) + 0.5, ax)) * step(hy, H);
    float arms = (1.0 - smoothstep(0.3, 0.9, abs(hy - H * 0.72))) * (1.0 - smoothstep(4.0, 5.0, ax)) + (1.0 - smoothstep(0.3, 0.9, abs(hy - H * 0.9))) * (1.0 - smoothstep(2.5, 3.5, ax));
    float wire = (1.0 - smoothstep(0.25, 0.9, seg(P, mf - vec2(0.0, H * 0.5), mf + vec2(-32.0, 6.0))))
      + (1.0 - smoothstep(0.25, 0.9, seg(P, mf - vec2(0.0, H * 0.5), mf + vec2(36.0, 8.0))))
      + (1.0 - smoothstep(0.25, 0.9, seg(P, mf - vec2(0.0, H * 0.86), mf + vec2(-30.0, 6.0))))
      + (1.0 - smoothstep(0.25, 0.9, seg(P, mf - vec2(0.0, H * 0.86), mf + vec2(34.0, 8.0))));
    col = mix(col, pal(mix(0.01, 0.05, day)), clamp(body + arms + wire * 0.45, 0.0, 1.0));
  }
  return col;
}
float sigAt(float T){ float n = noise(vec2(T * 0.11, 3.7)) * 0.65 + noise(vec2(T * 0.47, 9.1)) * 0.35; return mix(smoothstep(0.30, 0.74, n), 1.0, uLock); }
float rowOff(float row, float rp, float sg){
  float base = (hash(vec2(rp, 5.3)) - 0.5) * 0.24;
  float slant = (hash(vec2(rp, 1.7)) - 0.5) * 0.10 * row / 260.0;
  float jit = (noise(vec2(row * 0.35, rp * 7.0)) - 0.5) * 0.12 * (1.0 - sg);
  float tear = step(0.982, hash(vec2(row, rp + 0.5))) * (hash(vec2(row, rp + 9.0)) - 0.5) * 0.45;
  return (base + slant + jit + tear) * (1.0 - uLock);
}
void main(){
  vec2 fc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 w = (fc - uWin.xy) / uWin.zw;
  float t = uTime;
  vec2 o2 = max(max(-w, w - 1.0), 0.0);
  float od = length(o2 * uWin.zw);
  float grain = (hash(fc + fract(t * 7.0) * 97.0) - 0.5) * 0.045;
  if (od > 150.0) {
    float st = step(0.9986, hash(floor(fc / 2.0))) * uNight * (0.5 + 0.5 * sin(t * 1.3 + hash(floor(fc / 2.0) + 3.0) * 40.0));
    gl_FragColor = vec4(vec3(max(grain, 0.0) * 0.35) + uHigh * st * 0.35, 1.0); return;
  }
  vec2 p = w * vec2(2.4, 3.1);
  vec2 q = vec2(fbm3(p + vec2(0.0, t * 0.04)), fbm3(p + vec2(5.2, 1.3) - t * 0.035));
  vec2 r = vec2(fbm3(p + 2.6 * q + vec2(1.7, 9.2) + t * 0.025), fbm3(p + 2.6 * q + vec2(8.3, 2.8) - t * 0.02));
  float halo = fbm3(p * 0.6 + r) * exp(-od / 55.0) * 0.5;
  vec3 haloCol = pal(halo * 0.9) * halo * 1.4;
  if (od > 0.0) { gl_FragColor = vec4(haloCol + grain * 0.5, 1.0); return; }
  vec2 P = w * uWin.zw;
  float D = 23.0;
  float pn = floor(t / D); float s = fract(t / D);
  float row = floor(P.y / 2.0);
  float yr = (row * 2.0 + 1.0) / uWin.w;
  float rp = yr < s ? pn : pn - 1.0;
  float age = t - (rp + yr) * D;
  float band = floor(row / 8.0);
  float hold = step(0.94, hash(vec2(band, rp + 2.3))) * (1.0 - uLock);
  float rowS = mix(row, band * 8.0, hold);
  float ys = (rowS * 2.0 + 1.0) / uWin.w;
  float rt = (rp + ys) * D;
  float sg = sigAt(rt);
  float xs = fract(w.x + rowOff(rowS, rp, sg));
  vec3 sc = scene(vec2(xs, ys), rt);
  vec3 lw = vec3(0.299, 0.587, 0.114);
  float L = dot(sc, lw) / max(dot(uHigh, lw), 0.05);
  float snow = hash(floor(P / 2.0) + rp * 17.0);
  float dash = step(0.62, noise(vec2(w.x * 55.0 + hash(vec2(row, rp)) * 200.0, row * 3.1)));
  L = mix(L, (snow * 0.55 + dash * 0.45) * 0.8, (1.0 - sg) * 0.85);
  float seam = min(xs, 1.0 - xs);
  L *= 1.0 - 0.75 * (1.0 - smoothstep(0.004, 0.02, seam)) * (1.0 - uLock);
  L *= mix(1.0, 0.5, clamp(age / D, 0.0, 1.0));
  L += exp(-max(age, 0.0) * 2.0) * 0.25;
  float lv = mix(2.0, 5.0, sg);
  float qv = floor(clamp(L, 0.0, 1.2) * lv + bayer4(floor(P / 2.0))) / lv;
  vec3 col = pal(qv * 0.92 + 0.04);
  col += pal(1.0) * exp(-abs(yr - s) * uWin.w / 1.2) * 0.35;
  float acc = 0.0;
  float day = 1.0 - uNight;
  for (int k = 0; k < 2; k++) {
    float z = float(k);
    vec2 ps = p * vec2(0.75, 1.5) + uMouse * (0.05 + 0.07 * z) + vec2(z * 1.7, z * 0.9);
    vec2 drift = vec2(t * (0.018 + 0.016 * z), 0.0);
    float d = fbm5(ps + 1.7 * r + z * 0.3 - drift);
    float dl = fbm5(ps + 1.7 * r + z * 0.3 - drift + uLight.xy);
    d += 0.14 * ridged(ps * 2.6 + r * 2.0 + t * 0.02);
    float bz = (w.y - mix(0.50, 0.97, z)) / mix(0.14, 0.24, z);
    float a = smoothstep(0.40, 0.86, d + (exp(-bz * bz) * uFog - 0.55) * 0.5) * mix(0.5, 0.75, z);
    float lit = clamp(0.55 + (d - dl) * 7.0, 0.0, 1.0);
    vec3 c = pal((d * 0.8 + lit * 0.38) * mix(0.55, 1.0, day) + 0.04 * uFog);
    col = col * (1.0 - a) + c * a; acc = acc * (1.0 - a) + a;
  }
  vec2 lt = vec2((uMastU - 0.34) / 0.92 + 0.5, 0.90 - 0.22 * 0.86 * prof(6.0, uMastU)) * uWin.zw - vec2(0.0, 77.5);
  vec2 dv = P - lt; float dl2 = length(dv);
  vec3 red = vec3(0.94, 0.27, 0.27);
  col += red * uBlink * exp(-abs(dv.y) / 1.6) * (0.2 + 0.8 * exp(-abs(dv.x) / 90.0)) * 0.45;
  col += red * uBlink * (exp(-dl2 / 12.0) * 0.3 + exp(-dl2 / 70.0) * 0.1 * (0.6 + acc * 1.4));
  col += red * uBlink * exp(-(dv.x * dv.x / 40.0 + dv.y * dv.y / 3.0)) * 1.3 * (1.0 - acc * 0.6);
  col *= 0.95 + 0.05 * sin(fc.y * 3.14159);
  float e1 = min(min(w.x, 1.0 - w.x) / 0.10, min(w.y, 1.0 - w.y) / 0.08);
  float erode = fbm3(w * vec2(16.0, 20.0) + t * 0.02);
  float edge = smoothstep(0.0, 1.0, e1 - erode * 0.55 + 0.25);
  col = col * edge + haloCol * (1.0 - edge) + grain;
  gl_FragColor = vec4(col, 1.0);
}
`;
