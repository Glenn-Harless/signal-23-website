import * as THREE from 'three';

export const ForestShader = {
  uniforms: {
    uTime: { value: 0 },
    uSwayAmplitude: { value: 0.2 },
    uSwaySpeed: { value: 0.6 },
    uWindIntensity: { value: 0.1 },
    uFogNear: { value: 10 },
    uFogFar: { value: 80 },
    uFogColor: { value: new THREE.Color(0x000000) },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uSwayAmplitude;
    uniform float uSwaySpeed;
    uniform float uWindIntensity;

    varying vec2 vUv;
    varying float vDepth;
    varying float vHeight;

    void main() {
      vUv = uv;
      vHeight = position.y;
      
      // Calculate height factor (sway more at the top)
      float heightFactor = position.y / 10.0;
      
      vec3 worldPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      float phase = worldPos.x * 0.5 + worldPos.z * 0.3;
      
      // Multi-frequency swaying - make it more rigid/mechanical
      float primarySway = sin(uTime * uSwaySpeed + phase) * uSwayAmplitude;
      // High frequency digital "jitter"
      float jitter = sin(uTime * 40.0 + worldPos.y) * 0.002 * step(0.9, sin(uTime * 2.0 + phase));
      
      float gust = uWindIntensity * sin(uTime * 0.3 + phase * 0.1) * 0.5;
      
      float totalSway = (primarySway + gust) * heightFactor + jitter;
      
      vec3 transformed = position;
      transformed.x += totalSway;
      transformed.z += totalSway * 0.3;

      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
      vDepth = -mvPosition.z;

      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uFogNear;
    uniform float uFogFar;
    uniform vec3 uFogColor;
    
    varying vec2 vUv;
    varying float vDepth;
    varying float vHeight;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      // Dystopian monolith grey-green
      vec3 baseColor = vec3(0.06, 0.08, 0.07);
      
      // Data tremor/refresh effect
      float glitchLine = step(0.98, sin(vHeight * 4.0 - uTime * 2.0));
      float noise = hash(vec2(floor(vHeight * 20.0), floor(uTime * 15.0)));
      float refresh = glitchLine * noise * 0.1;
      
      baseColor += refresh;

      // Subtle edge highlight (digital feel)
      float edge = smoothstep(0.45, 0.5, abs(vUv.x - 0.5));
      baseColor += edge * 0.02;

      // Fog calculation
      float fogFactor = smoothstep(uFogNear, uFogFar, vDepth);
      vec3 finalColor = mix(baseColor, uFogColor, fogFactor);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};
