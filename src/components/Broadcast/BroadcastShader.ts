import { noiseShader } from '../Portal/PortalShader';

export const BroadcastShader = {
    uniforms: {
        uTime: { value: 0 },
        uRingProgress: { value: 0 },
        uFrequencyData: { value: 0 },
        uColor: { value: [1.0, 1.0, 1.0] },
        uOpacity: { value: 1.0 }
    },
    vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    ${noiseShader}
    
    uniform float uTime;
    uniform float uRingProgress;
    uniform float uFrequencyData;
    uniform vec3 uColor;
    uniform float uOpacity;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      // Distance from center of the ring (assuming a circular mesh/torus)
      // Actually we'll use the UVs or local position for the circle logic
      float dist = length(vUv - 0.5) * 2.0; 
      
      // Degradation based on distance from center/progress
      float degradation = smoothstep(0.3, 1.0, uRingProgress);
      
      // Noise-based fragmentation
      float noise = snoise(vec3(vUv * (10.0 + uFrequencyData * 5.0), uTime * 0.5));
      float fragment = step(noise * (degradation + 0.1), 0.5);
      
      // Ring visibility (a thin ring expanding)
      // Note: If using a real Torus geometry, we might just use the fragment logic
      // to "eat away" at the mesh.
      
      float ringAlpha = (1.0 - degradation * 0.8) * uOpacity;
      ringAlpha *= fragment;
      
      gl_FragColor = vec4(uColor, ringAlpha);
    }
  `
};
