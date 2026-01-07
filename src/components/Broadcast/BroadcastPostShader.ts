export const BroadcastPostShader = {
    uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uChromAberration: { value: 0.005 },
        uGrain: { value: 0.05 },
        uScanning: { value: 0.1 },
        uVignette: { value: 1.0 }
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uChromAberration;
    uniform float uGrain;
    uniform float uScanning;
    uniform float uVignette;
    varying vec2 vUv;

    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      // Chromatic Aberration
      vec2 rUv = vUv + vec2(uChromAberration, 0.0);
      vec2 gUv = vUv;
      vec2 bUv = vUv - vec2(uChromAberration, 0.0);

      float r = texture2D(tDiffuse, rUv).r;
      float g = texture2D(tDiffuse, gUv).g;
      float b = texture2D(tDiffuse, bUv).b;

      vec3 color = vec3(r, g, b);

      // Film Grain
      float grain = random(vUv + uTime) * uGrain;
      color += grain;

      // Scanlines
      float scanline = sin(vUv.y * 800.0 + uTime * 5.0) * uScanning;
      color -= scanline;

      // Vignette
      float dist = distance(vUv, vec2(0.5));
      color *= smoothstep(0.8, 0.2, dist * uVignette);

      gl_FragColor = vec4(color, 1.0);
    }
  `
};
