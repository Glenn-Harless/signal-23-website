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
      float heightFactor = position.y / 10.0; // Assuming tree height around 10
      
      // Sway animation using instance position as phase offset
      // We'll use instanceMatrix to get the world position indirectly or pass an attribute
      // For InstancedMesh, we can use instances' position or a custom attribute phase
      // Here we'll just use the modelMatrix's translation part
      vec3 worldPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      float phase = worldPos.x * 0.5 + worldPos.z * 0.3;
      
      // Multi-frequency swaying
      float primarySway = sin(uTime * uSwaySpeed + phase) * uSwayAmplitude;
      float secondarySway = sin(uTime * 1.7 + phase * 2.3) * (uSwayAmplitude * 0.3);
      float microTremor = sin(uTime * 4.0 + phase * 5.0) * (uSwayAmplitude * 0.1);
      
      // Wind gusts
      float gust = uWindIntensity * sin(uTime * 0.3 + phase * 0.1) * 0.5;
      
      float totalSway = (primarySway + secondarySway + microTremor + gust) * heightFactor;
      
      vec3 transformed = position;
      transformed.x += totalSway;
      transformed.z += totalSway * 0.5;

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

    void main() {
      // Dark forest green tint
      vec3 baseColor = vec3(0.15, 0.22, 0.18);
      
      // Breathing pulse "life"
      float phase = fract(vHeight * 0.1 + uTime * 0.2);
      float aliveGlow = 0.03 + 0.02 * sin(uTime * 0.5 + vHeight * 0.5);
      baseColor += aliveGlow;

      // Subtle detail
      float lineDetail = smoothstep(0.4, 0.5, abs(vUv.x - 0.5));
      baseColor += lineDetail * 0.05;

      // Fog calculation
      float fogFactor = smoothstep(uFogNear, uFogFar, vDepth);
      vec3 finalColor = mix(baseColor, uFogColor, fogFactor);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};
