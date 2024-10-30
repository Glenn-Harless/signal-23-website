export const noiseShader = `
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute( 
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for(int i = 0; i < 4; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }
`;

export const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  ${noiseShader}
  
  uniform float time;
  uniform vec2 mouse;
  uniform vec2 resolution;
  uniform bool isMobile;
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    
    // Adjust center and portal size based on screen type
    vec2 center;
    vec2 portalSize;
    
    if (isMobile) {
      // Mobile: Center horizontally but maintain vertical offset
      center = vec2(0.5, 0.5);
      // Taller and slightly narrower portal for mobile
      portalSize = vec2(0.85, 1.2);
    } else {
      // Desktop: Off-center positioning
      center = vec2(0.5, 0.5);
      portalSize = vec2(2, .75);
    }
    
    // Calculate rectangular mask with smooth edges
    float horizontalMask = smoothstep(0.0, 0.05, abs(uv.x - center.x) - portalSize.x * (isMobile ? 0.15 : 0.1));
    float verticalMask = smoothstep(0.0, 0.05, abs(uv.y - center.y) - portalSize.y * (isMobile ? 0.3 : 0.5));
    float frame = max(horizontalMask, verticalMask);
    
    // Adjust mouse interaction based on device type
    vec2 mouseOffset = (mouse - center) * (isMobile ? 0.05 : 0.1);
    float mouseRatio = smoothstep(1.0, 0.0, length((uv + mouseOffset - center) * 2.0));
    
    // Create ripple effect
    vec2 q = uv * 2.0 - 1.0;
    q += mouseOffset;
    float ripple = sin(length(q) * 10.0 - time * 2.0) * 0.5 + 0.5;
    
    // Create flowing waves using FBM noise
    float noise = fbm(vec3(uv * 6.0 + mouseOffset, time * 0.2));
    noise += fbm(vec3(uv * 3.0 + vec2(noise) * 0.5 + mouseOffset, time * 0.15));
    
    // Create glowing edge effect
    float edge = (1.0 - frame) * 0.8;
    float glow = smoothstep(0.5, 0.0, length((uv - center) * 2.0)) * 0.5;
    
    // Combine everything with a white glow
    vec3 color = vec3(1.0);
    float alpha = (noise * 0.8 + ripple * 0.2 + glow) * (1.0 - frame) + edge * 0.5;
    
    gl_FragColor = vec4(color, alpha);
  }
`;