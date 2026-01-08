import * as THREE from 'three';

export const ForestShader = {
    uniforms: {
        uTime: { value: 0 },
        uSwayAmplitude: { value: 0.05 },
        uSwaySpeed: { value: 1.0 },
        uFogNear: { value: 10 },
        uFogFar: { value: 50 },
        uFogColor: { value: new THREE.Color(0x000000) },
    },
    vertexShader: `
    uniform float uTime;
    uniform float uSwayAmplitude;
    uniform float uSwaySpeed;

    varying vec2 vUv;
    varying float vDepth;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      
      // Calculate height factor (sway more at the top)
      float heightFactor = position.y / 10.0; // Assuming tree height around 10
      
      // Sway animation using instance position as phase offset
      // We'll use instanceMatrix to get the world position indirectly or pass an attribute
      // For InstancedMesh, we can use instances' position or a custom attribute phase
      // Here we'll just use the modelMatrix's translation part
      vec3 worldPos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      float phase = worldPos.x * 0.5 + worldPos.z * 0.3;
      
      float sway = sin(uTime * uSwaySpeed + phase) * uSwayAmplitude * heightFactor;
      
      vec3 transformed = position;
      transformed.x += sway;
      transformed.z += sway * 0.5;

      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(transformed, 1.0);
      vViewPosition = -mvPosition.xyz;
      vDepth = -mvPosition.z;

      gl_Position = projectionMatrix * mvPosition;
    }
  `,
    fragmentShader: `
    uniform float uFogNear;
    uniform float uFogFar;
    uniform vec3 uFogColor;
    
    varying vec2 vUv;
    varying float vDepth;

    void main() {
      vec3 baseColor = vec3(0.2, 0.2, 0.2); // Dormant charcoal
      
      // Add subtle detail based on local position/UV
      float lineDetail = smoothstep(0.45, 0.5, abs(vUv.x - 0.5));
      baseColor += lineDetail * 0.1;

      // Fog calculation
      float fogFactor = smoothstep(uFogNear, uFogFar, vDepth);
      vec3 finalColor = mix(baseColor, uFogColor, fogFactor);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};
