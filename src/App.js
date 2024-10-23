import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Music2, Mail, Info, ExternalLink } from 'lucide-react';
import * as THREE from 'three';

const App = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const dropdownTimeoutRef = useRef(null);

  // Define navigation links
  const navLinks = [
    { 
      // icon: <Info className="w-5 h-5" />,
      label: "INFO",
      href: "#",
      description: "About Signal-23" 
    },
    { 
      // icon: <Mail className="w-5 h-5" />,
      label: "CONTACT",
      href: "mailto:your@email.com",
      description: "Get in touch" 
    },
    // Uncomment to add music platforms
    // { 
    //   // icon: <Music2 className="w-5 h-5" />,
    //   label: "MUSIC",
    //   href: "#",
    //   description: "Listen on platforms",
    //   platforms: [
    //     { name: "Spotify", url: "#" },
    //     { name: "Apple Music", url: "#" },
    //     { name: "Bandcamp", url: "#" },
    //     { name: "SoundCloud", url: "#" }
    //   ]
    // }
  ];

  // Dropdown menu control
  const handleMouseEnter = (index) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setHoveredLink(index);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredLink(null);
    }, 300);
  };

  // Add useEffect to detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Audio control
  useEffect(() => {
    if (isPlayingAudio) {
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlayingAudio]);

  // Complete noise implementation
  const noiseShader = `
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

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
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
        center = vec2(0.33, 0.5);
        portalSize = vec2(1.25, 0.8);
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

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);

    const geometry = new THREE.PlaneGeometry(16, 9, 128, 128);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        mouse: { value: new THREE.Vector2(0.5, 0.5) },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        isMobile: { value: window.innerWidth <= 768 }
      },
      transparent: true,
      side: THREE.DoubleSide
    });

    const portal = new THREE.Mesh(geometry, material);
    scene.add(portal);

    camera.position.z = 7;

    const handleMouseMove = (event) => {
      mouseRef.current.x = (event.clientX / window.innerWidth);
      mouseRef.current.y = 1 - (event.clientY / window.innerHeight);
    };

    const handleTouchMove = (event) => {
      if (event.touches.length > 0) {
        mouseRef.current.x = (event.touches[0].clientX / window.innerWidth);
        mouseRef.current.y = 1 - (event.touches[0].clientY / window.innerHeight);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.01;

      material.uniforms.time.value = time;
      material.uniforms.mouse.value.set(mouseRef.current.x, mouseRef.current.y);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      material.uniforms.resolution.value.set(width, height);
      material.uniforms.isMobile.value = width <= 768;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Fix for white borders */}
      <div className="fixed inset-0 bg-black -z-10" />
      
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full z-0"
      />
{/* Desktop layout */}
<div className="hidden md:block absolute inset-0 z-10">
      {/* Centered play button - floating over everything */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
        <button 
          onClick={() => setIsPlayingAudio(!isPlayingAudio)} 
          className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          {isPlayingAudio ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
        </button>
      </div>

      {/* Text column - positioned relative to door's end */}
      <div className="absolute right-20 top-0 h-full flex flex-col justify-center">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="text-6xl font-bold text-white font-neo-brutalist mb-8"
          >
            SIGNAL-23
          </div>
        ))}
      </div>
    </div>
      
      {/* Mobile view */}
      <div className="md:hidden absolute inset-0 flex flex-col items-center z-20">
        <h1 className="text-5xl font-bold text-white font-neo-brutalist mt-12">
          SIGNAL-23
        </h1>
        <div className="absolute top-1/2 transform -translate-y-1/2">
          <button 
            onClick={() => setIsPlayingAudio(!isPlayingAudio)} 
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            {isPlayingAudio ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
          </button>
        </div>
      </div>
  
      {/* Navigation Links */}
      <nav className="absolute bottom-0 left-0 right-0 p-6 z-20">
        <div className="flex justify-center space-x-8">
          {navLinks.map((link, index) => (
            <div 
              key={index} 
              className="relative"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <a
                href={link.href}
                className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
              >
                {link.icon}
                <span className="text-sm font-medium">{link.label}</span>
              </a>
              
              {/* Dropdown for Music platforms */}
              {link.platforms && hoveredLink === index && (
                <div 
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 rounded-md shadow-lg bg-white/10 backdrop-blur-sm"
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="py-1">
                    {link.platforms.map((platform, pIndex) => (
                      <a
                        key={pIndex}
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-4 py-2 text-sm text-white hover:bg-white/20"
                      >
                        {platform.name}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
  
      <audio ref={audioRef} loop>
        <source src="/pieces-website-mp3.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default App;