// The home portal's shader, ported from the Station Concepts design canvas (option B).
// One triangle covers the screen: faint stars outside the window at night, a halo around it, and the
// heavy work only inside the window rectangle (uWin, in canvas pixels, top-left origin).

export const PORTAL_VERTEX = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';

// Domain-warped fbm in three parallax slices with self-shadowing, a slow inner light and the ripple.
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
  col *= 0.95 + 0.05 * sin(fc.y * 3.14159);
  col = col * edge + haloCol * (1.0 - edge) + grain;
  gl_FragColor = vec4(col, 1.0);
}
`;
