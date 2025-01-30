# Table of Contents
- project_summary.md
- babel.config.json
- .babelrc
- tailwind.config.js
- netlify.toml
- webpack.config.js
- README.md
- .dockerignore
- package.json
- tsconfig.json
- docker-compose.yml
- postcss.config.js
- Dockerfile.frontend
- public/index.html
- src/index.tsx
- src/App.tsx
- DEPRECATED/static_app.tsx
- src/styles/main.css
- src/styles/responsive.css
- src/styles/fonts.css
- src/components/Portal/PortalShader.ts
- src/components/Portal/Portal.tsx
- src/components/Navigation/NavigationLink.tsx
- src/components/Terminal/Terminal.tsx
- src/components/Audio/AudioPlayer.tsx
- src/components/EnhancedNumberStation/EnhancedNumberStation.tsx
- src/components/GlitchOverlay/GlitchOverlay.tsx
- src/components/TextStack/TextStack.tsx
- src/assets/images/DALLE_2024-10-04_14.18.22_-_A_minimalistic_dystopian_landscape_with_only_a_few_faded_abstract_shapes_resembling_abandoned_buildings._The_structures_appear_ghostly_and_barely_visi.jpeg
- src/assets/images/DALL·E 2024-10-10 12.13.05 - Create a more impressionist, minimalistic, and ruin-like logo for the electronic duo 'Signal-23.' The design should evoke the feeling of abandoned.jpg

## File: project_summary.md

- Extension: .md
- Language: markdown
- Size: 128468 bytes
- Created: 2025-01-27 16:44:37
- Modified: 2025-01-27 16:44:37

### Code

```markdown
# Table of Contents
- project_summary.md
- babel.config.json
- .babelrc
- tailwind.config.js
- netlify.toml
- webpack.config.js
- README.md
- .dockerignore
- package.json
- tsconfig.json
- docker-compose.yml
- postcss.config.js
- Dockerfile.frontend
- public/index.html
- src/index.tsx
- src/App.tsx
- DEPRECATED/static_app.tsx
- src/styles/main.css
- src/styles/responsive.css
- src/styles/fonts.css
- src/components/Portal/PortalShader.ts
- src/components/Portal/Portal.tsx
- src/components/Navigation/NavigationLink.tsx
- src/components/Terminal/Terminal.tsx
- src/components/Audio/AudioPlayer.tsx
- src/components/EnhancedNumberStation/EnhancedNumberStation.tsx
- src/components/GlitchOverlay/GlitchOverlay.tsx
- src/components/TextStack/TextStack.tsx
- src/assets/images/DALLE_2024-10-04_14.18.22_-_A_minimalistic_dystopian_landscape_with_only_a_few_faded_abstract_shapes_resembling_abandoned_buildings._The_structures_appear_ghostly_and_barely_visi.jpeg
- src/assets/images/DALL·E 2024-10-10 12.13.05 - Create a more impressionist, minimalistic, and ruin-like logo for the electronic duo 'Signal-23.' The design should evoke the feeling of abandoned.jpg

## File: project_summary.md

- Extension: .md
- Language: markdown
- Size: 62283 bytes
- Created: 2025-01-27 16:05:50
- Modified: 2025-01-27 16:05:50

### Code

```markdown
# Table of Contents
- babel.config.json
- .babelrc
- tailwind.config.js
- netlify.toml
- webpack.config.js
- README.md
- .dockerignore
- package.json
- tsconfig.json
- docker-compose.yml
- postcss.config.js
- Dockerfile.frontend
- public/index.html
- src/index.tsx
- src/App.tsx
- DEPRECATED/static_app.tsx
- src/styles/main.css
- src/styles/responsive.css
- src/styles/fonts.css
- src/components/Portal/PortalShader.ts
- src/components/Portal/Portal.tsx
- src/components/Navigation/NavigationLink.tsx
- src/components/Audio/AudioPlayer.tsx
- src/components/EnhancedNumberStation/EnhancedNumberStation.tsx
- src/components/GlitchOverlay/GlitchOverlay.tsx
- src/components/TextStack/TextStack.tsx
- src/assets/images/DALLE_2024-10-04_14.18.22_-_A_minimalistic_dystopian_landscape_with_only_a_few_faded_abstract_shapes_resembling_abandoned_buildings._The_structures_appear_ghostly_and_barely_visi.jpeg
- src/assets/images/DALL·E 2024-10-10 12.13.05 - Create a more impressionist, minimalistic, and ruin-like logo for the electronic duo 'Signal-23.' The design should evoke the feeling of abandoned.jpg

## File: babel.config.json

- Extension: .json
- Language: json
- Size: 204 bytes
- Created: 2024-10-24 21:56:22
- Modified: 2024-10-24 21:56:22

### Code

```json
{
    "presets": [
      "@babel/preset-env",
      ["@babel/preset-react", {
        "runtime": "classic"  // Use classic runtime instead of automatic
      }],
      "@babel/preset-typescript"
    ]
  }
```

## File: .babelrc

- Extension: 
- Language: unknown
- Size: 65 bytes
- Created: 2024-10-23 20:20:46
- Modified: 2024-10-23 20:20:46

### Code

```unknown
{
    "presets": ["@babel/preset-env", "@babel/preset-react"]
  }
```

## File: tailwind.config.js

- Extension: .js
- Language: javascript
- Size: 1609 bytes
- Created: 2025-01-09 19:52:02
- Modified: 2025-01-09 19:52:02

### Code

```javascript
module.exports = {
  purge: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './src/styles/**/*.css'
  ],
  darkMode: false,
  theme: {
    extend: {
      fontFamily: {
        'neo-brutalist': ['Neo Brutalist', 'sans-serif'],
        'neo-brute-transparent': ['Neobrutetest', 'sans-serif'],
        'neo-brutalist4': ['NeobruteTest4', 'sans-serif'],
        'neo-brutalist5': ['NeobruteTest5', 'sans-serif'],
        'neo-brutalist6': ['NeobruteTest6', 'sans-serif'],
        'neo-brutalist7': ['NeobruteTest7', 'sans-serif'],
        'neo-brutalist8': ['NeobruteTest8', 'sans-serif'],
        'neo-brutalist9': ['NeobruteTest9', 'sans-serif'],
        'ibm-mono': ['IBM Plex Mono', 'monospace'],
        'space-mono': ['Space Mono', 'monospace'],
      },
      animation: {
        'flash': 'flash 0.5s ease-in-out infinite',
        'tear': 'tear 0.2s ease-in-out infinite',
        'scanline': 'scanline 1s linear infinite',
        'flicker': 'flicker 0.2s ease-in-out infinite',
      },
      keyframes: {
        flash: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
        tear: {
          '0%, 100%': { transform: 'translateY(0) skewY(-3deg)' },
          '50%': { transform: 'translateY(5px) skewY(-2deg)' },
        },
        scanline: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  variants: {
    extend: {}
  },
  plugins: [],
}

```

## File: netlify.toml

- Extension: .toml
- Language: toml
- Size: 280 bytes
- Created: 2024-10-21 21:19:59
- Modified: 2024-10-21 21:19:59

### Code

```toml
[build]
  publish = "build"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "14"

[[headers]]
  for = "/*"
    [headers.values]
    Access-Control-Allow-Origin = "*"

[[headers]]
  for = "*.mp3"
    [headers.values]
    Cache-Control = "public, max-age=31536000"
```

## File: webpack.config.js

- Extension: .js
- Language: javascript
- Size: 1945 bytes
- Created: 2024-11-15 10:32:20
- Modified: 2024-11-15 10:32:20

### Code

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',  // Changed from index.js to index.tsx
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,  // Add TypeScript file handling
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
                '@babel/preset-typescript'  // Add TypeScript preset
              ]
            }
          }
        ]
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(mp3|wav)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]'
        }
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '',
          globOptions: {
            ignore: ['**/index.html'],
          },
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.css'],  // Add TypeScript extensions
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    hot: true,
    port: 8080,
    host: '0.0.0.0',
  },
};
```

## File: README.md

- Extension: .md
- Language: markdown
- Size: 4184 bytes
- Created: 2024-10-22 09:16:35
- Modified: 2024-10-22 09:16:35

### Code

```markdown
# SIGNAL-23 Website

A React-based website for the electronic music duo Signal-23, featuring an interactive noise background with dynamic signal effects.

## Installation

1. Install Docker:
   - Windows/Mac: Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Linux: Follow your distribution's instructions for installing Docker Engine

2. Clone the repository:
```bash
git clone https://github.com/yourusername/signal-23-website.git
cd signal-23-website
```

3. Run with Docker:
```bash
docker compose up --build
```

4. Open your browser and go to: http://localhost:8080

## Project Structure

### Root Configuration Files
- `docker-compose.yml` - Docker Compose configuration for local development
- `Dockerfile` - Container configuration for building the development environment
- `netlify.toml` - Netlify deployment configuration
- `package.json` - Node.js project configuration and dependencies
- `postcss.config.js` - PostCSS configuration for CSS processing
- `tailwind.config.js` - Tailwind CSS customization and configuration
- `webpack.config.js` - Webpack build and development server configuration

### Source Code (`/src`)
- `index.js` - Application entry point
- `App.js` - Main React component with noise effect and navigation
- `App.lines.js` - Alternative version with line effects
- `App.static.js` - Static version of the main component

#### Components (`/src/components`)
- `AudioPlayer.js` - Audio playback component
- `MusicLinks.js` - Music platform links component
- `SocialLinks.js` - Social media links component

#### Styles (`/src/styles`)
- `main.css` - Primary stylesheet with Tailwind imports
- `fonts.css` - Custom font declarations
- `responsive.css` - Media queries and responsive styling

#### Assets (`/src/assets`)
- `/fonts` - Custom fonts including Neo Brutalist
- `/images` - Project images and artwork

### Public Files (`/public`)
- `index.html` - HTML entry point
- `abridged_tim0.mp3` - Audio content

## Key Technologies

- React
- Tailwind CSS
- Docker
- Webpack
- Netlify for deployment

## File Details

### Configuration Files
```javascript
// webpack.config.js
// Configures build process, including:
// - JavaScript/JSX processing
// - CSS/PostCSS processing
// - Asset handling (fonts, audio)
// - Development server setup

// tailwind.config.js
// Customizes Tailwind CSS, including:
// - Custom font configurations
// - Theme extensions
// - Responsive design utilities

// postcss.config.js
// Sets up PostCSS plugins:
// - Tailwind CSS
// - Autoprefixer for browser compatibility
```

### Core React Components
```javascript
// src/index.js
// Application entry point:
// - Renders main App component
// - Imports global styles

// src/App.js
// Main application component:
// - Implements noise background effect
// - Handles audio playback
// - Manages navigation and dropdowns
```

### Styling
```css
/* styles/main.css */
// Primary stylesheet:
// - Imports Tailwind directives
// - Imports custom fonts
// - Imports responsive styles

/* styles/responsive.css */
// Responsive design rules:
// - Tablet adaptations (768px+)
// - Desktop layouts (1024px+)
```

### Docker Configuration
```yaml
# docker-compose.yml
# Development environment setup:
# - Port mapping (8080)
# - Volume mounts for hot reloading
# - Environment variables

# Dockerfile
# Container configuration:
# - Node.js setup
# - Dependency installation
# - Development server startup
```

## Development

The project uses Docker for consistent development environments. The development server includes:
- Hot reloading
- Source maps
- Development build optimizations

To stop the development server:
```bash
docker compose down
```

## Deployment

The site is deployed on Netlify. The `netlify.toml` configuration handles:
- Build commands
- Environment setup
- Headers for audio file caching
- CORS configuration

## Troubleshooting

If you encounter issues:
1. Check Docker is running
2. Ensure ports are available (8080)
3. Check console for build errors
4. Clear Docker cache if needed:
   ```bash
   docker compose down
   docker compose build --no-cache
   ```

For other issues, please open a GitHub issue.
```

## File: .dockerignore

- Extension: 
- Language: unknown
- Size: 358 bytes
- Created: 2024-11-15 10:32:20
- Modified: 2024-11-15 10:32:20

### Code

```unknown
node_modules
npm-debug.log
build
# Version control
.git
.gitignore

# Dependencies
node_modules
ai_be/venv

# Environment variables
.env
.env.local
.env.*.local

# IDE files
.idea
.vscode
*.swp
*.swo

# Build outputs
dist
build
*.pyc
__pycache__
.pytest_cache

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# Docker
Dockerfile*
docker-compose*
```

## File: package.json

- Extension: .json
- Language: json
- Size: 1066 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```json
{
  "name": "signal-23-website",
  "version": "1.0.0",
  "scripts": {
    "start": "webpack serve --mode development --host 0.0.0.0 --port 8080",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "lucide-react": "^0.263.1",
    "three": "^0.157.0",
    "ts-loader": "^9.4.2",
    "simplex-noise": "^4.0.1"
  },
  "devDependencies": {
    "@babel/core": "^7.15.0",
    "@babel/preset-env": "^7.15.0",
    "@babel/preset-react": "^7.14.5",
    "@babel/preset-typescript": "^7.15.0", 
    "@types/react": "^17.0.0",           
    "@types/react-dom": "^17.0.0",
    "@types/three": "^0.157.0",
    "typescript": "^4.5.0",
    "autoprefixer": "^10.3.1",
    "babel-loader": "^8.2.2",
    "css-loader": "^6.2.0",
    "html-webpack-plugin": "^5.3.2",
    "postcss": "^8.3.6",
    "postcss-loader": "^6.1.1",
    "style-loader": "^3.2.1",
    "tailwindcss": "^2.2.7",
    "webpack": "^5.50.0",
    "webpack-cli": "^4.8.0",
    "webpack-dev-server": "^4.0.0",
    "copy-webpack-plugin": "^11.0.0"
  }
}
```

## File: tsconfig.json

- Extension: .json
- Language: json
- Size: 795 bytes
- Created: 2024-10-24 21:56:22
- Modified: 2024-10-24 21:56:22

### Code

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "jsx": "react",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    },
    "noImplicitAny": false,
    "outDir": "./dist",  // Add output directory
    "sourceMap": true    // Enable source maps
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.js",
    "src/**/*.jsx"
  ],
  "exclude": ["node_modules"]
}
```

## File: docker-compose.yml

- Extension: .yml
- Language: yaml
- Size: 238 bytes
- Created: 2024-11-15 10:32:20
- Modified: 2024-11-15 10:32:20

### Code

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "8080:8080"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true
```

## File: postcss.config.js

- Extension: .js
- Language: javascript
- Size: 104 bytes
- Created: 2024-10-21 11:32:00
- Modified: 2024-10-21 11:32:00

### Code

```javascript
module.exports = {
    plugins: [
      require('tailwindcss'),
      require('autoprefixer'),
    ]
  }
```

## File: Dockerfile.frontend

- Extension: .frontend
- Language: unknown
- Size: 772 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```unknown
FROM node:14

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Copy TypeScript config
COPY tsconfig.json ./

# Clean npm cache and remove existing node_modules (if any)
RUN npm cache clean --force && \
    rm -rf node_modules

# Install dependencies including TypeScript and Babel presets
RUN npm install --save-dev typescript @types/react @types/react-dom @types/three @babel/preset-typescript

# Install all other dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Ensure the public directory exists
RUN mkdir -p public

# Copy the audio file to the public directory
COPY public/abridged_tim0.mp3 public/

# Expose the port your app runs on
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
```

## File: public/index.html

- Extension: .html
- Language: html
- Size: 299 bytes
- Created: 2024-11-15 10:32:20
- Modified: 2024-11-15 10:32:20

### Code

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="/favicon logo 32x32.png" />
    <title>Signal-23</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>
```

## File: src/index.tsx

- Extension: .tsx
- Language: typescript
- Size: 224 bytes
- Created: 2024-10-24 21:56:22
- Modified: 2024-10-24 21:56:22

### Code

```typescript
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/main.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
```

## File: src/App.tsx

- Extension: .tsx
- Language: typescript
- Size: 5816 bytes
- Created: 2025-01-09 19:57:08
- Modified: 2025-01-09 19:57:08

### Code

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { Music2, Mail, Info, Play, Pause } from 'lucide-react';
import { Portal } from './components/Portal/Portal';
import { AudioPlayer } from './components/Audio/AudioPlayer';
import { NavigationLink } from './components/Navigation/NavigationLink';
import { DistortedStack } from './components/TextStack/TextStack';
import { EnhancedNumberStation } from './components/EnhancedNumberStation/EnhancedNumberStation';
import { GlitchOverlay } from './components/GlitchOverlay/GlitchOverlay';

interface NavLink {
  icon?: React.ReactNode;
  label: string;
  href?: string;
  description: string;
  platforms?: Array<{
    name: string;
    url: string;
  }>;
}

interface NumberStationProps {
  isMobile: boolean;
}

const App: React.FC = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showGlitch, setShowGlitch] = useState(false);  // Added this state

  const navLinks: NavLink[] = [
    { 
      label: "music@signal23.net",
      // href: "mailto:signal.23.music@gmail.com",
      description: "Get in touch" 
    }
  ];

  useEffect(() => {
    // Log when component mounts
    console.log('Checking font loading...');
    
    // Try to create a temporary element with the font
    const testElement = document.createElement('span');
    testElement.style.fontFamily = 'Neobrutalist2';
    testElement.textContent = 'Test';
    document.body.appendChild(testElement);
    
    // Log computed style
    const computedStyle = window.getComputedStyle(testElement);
    console.log('Applied font family:', computedStyle.fontFamily);
    
    // Clean up
    document.body.removeChild(testElement);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <div className="fixed inset-0 bg-black -z-10" />
        
        {/* Base layout container */}
        <div className="relative h-full">
          {/* Position the play button relative to the Portal */}
          <div className="absolute inset-0 z-20">
            <AudioPlayer 
              isPlaying={isPlayingAudio}
              onPlayPause={() => setIsPlayingAudio(!isPlayingAudio)}
              audioSource="/pieces-website-mp3.mp3"
            />
          </div>

          <Portal isMobile={isMobile} />
          <EnhancedNumberStation 
            isMobile={isMobile}
            onGlitchChange={setShowGlitch}
          />

          {/* Desktop Layout */}
          <div className="hidden md:grid grid-cols-12 h-full relative z-10">
            {/* Left section - Animation area */}
            <div className="col-span-7 xl:col-span-8 relative">
              {/* Removed AudioPlayer from here */}
            </div>

            {/* Right section - Text stack area */}
            <div className="col-span-5 xl:col-span-4 relative">
              <div className="h-full">
                <DistortedStack isPlayingAudio={isPlayingAudio} />
              </div>
            </div>
          </div>

          {/* Mobile Layout - Keep visible button for mobile */}
          <div className="md:hidden flex flex-col items-center h-full relative z-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-white font-neo-brute-transparent mt-12">
              SIGNAL-3
            </h1>
            <div className="absolute top-1/2 -translate-y-1/2">
              {/* <button 
                onClick={() => setIsPlayingAudio(!isPlayingAudio)} 
                className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                {isPlayingAudio ? 
                  <Pause className="w-8 h-8 text-white" /> : 
                  <Play className="w-8 h-8 text-white" />
                }
              </button> */}
            </div>
          </div>

          {/* Navigation */}
          <nav className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <div className="flex justify-center space-x-8 opacity-60 font-ibm-mono">
              {navLinks.map((link, index) => (
                <NavigationLink key={index} {...link} />
              ))}
            </div>
          </nav>
        </div>

        {/* Keep SVG filters */}
        <svg className="hidden">
          <defs>
            <filter id="eroded-blur">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="1.2"
                numOctaves="5"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="12"
              />
              <feGaussianBlur stdDeviation=".3"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncG type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncB type="linear" slope="1.8" intercept="-0.2"/>
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic"/>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Render GlitchOverlay at the root level */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
        <GlitchOverlay isActive={showGlitch} />
      </div>
    </>
  );
};

export default App;
```

## File: DEPRECATED/static_app.tsx

- Extension: .tsx
- Language: typescript
- Size: 7855 bytes
- Created: 2024-11-15 10:32:20
- Modified: 2024-11-15 10:32:20

### Code

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Music2, Mail, Info, ExternalLink } from 'lucide-react';

const App = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);

  const navLinks = [
    { 
      icon: <Info className="w-5 h-5" />,
      label: "INFO",
      href: "#",
      description: "About Signal-23" 
    },
    { 
      icon: <Mail className="w-5 h-5" />,
      label: "CONTACT",
      href: "mailto:your@email.com",
      description: "Get in touch" 
    },
    { 
      icon: <Music2 className="w-5 h-5" />,
      label: "MUSIC",
      href: "#",
      description: "Listen on platforms",
      platforms: [
        { name: "Spotify", url: "#" },
        { name: "Apple Music", url: "#" },
        { name: "Bandcamp", url: "#" },
        { name: "SoundCloud", url: "#" }
      ]
    }
  ];

  // Canvas and noise effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;     // red
        data[i + 1] = value; // green
        data[i + 2] = value; // blue
        data[i + 3] = 255;   // alpha
      }

      return imageData;
    };

    const drawSignal = (imageData) => {
      const data = imageData.data;
      const signalPhrase = "SIGNAL-23";
      const signalStart = Math.random() * (data.length / 4 - signalPhrase.length * 8);

      for (let i = 0; i < signalPhrase.length; i++) {
        const charCode = signalPhrase.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
          const bit = (charCode >> j) & 1;
          const index = (signalStart + i * 8 + j) * 4;
          if (bit && index < data.length - 4) {
            data[index] = 255;     // red
            data[index + 1] = 0;   // green
            data[index + 2] = 0;   // blue
          }
        }
      }
    };

    const drawWave = (imageData, type) => {
      const data = imageData.data;
      const width = canvas.width;
      const startY = Math.random() * canvas.height;
      const amplitude = Math.random() * 30 + 10;
      const frequency = Math.random() * 0.02 + 0.01;
      const thickness = Math.floor(Math.random() * 3) + 1;

      for (let x = 0; x < width; x++) {
        let y;

        switch(type) {
          case 'sine':
            y = startY + Math.sin(x * frequency + time) * amplitude;
            break;
          case 'triangle':
            y = startY + (Math.abs(((x * frequency + time) % (2 * Math.PI)) - Math.PI) - Math.PI/2) * amplitude/2;
            break;
          case 'saw':
            y = startY + ((x * frequency + time) % Math.PI) * amplitude/Math.PI;
            break;
          default:
            y = startY + Math.sin(x * frequency + time) * amplitude;
        }

        for (let t = -thickness; t <= thickness; t++) {
          const yPos = Math.floor(y + t);
          if (yPos >= 0 && yPos < canvas.height) {
            const index = (yPos * width + x) * 4;
            if (index < data.length - 4) {
              data[index] = 255;     // white waves
              data[index + 1] = 255;
              data[index + 2] = 255;
            }
          }
        }
      }
    };

    const animate = () => {
      const imageData = generateNoise();

      if (Math.random() < 0.1) {
        drawSignal(imageData);
      }

      if (Math.random() < 0.2) {
        const waveTypes = ['sine', 'triangle', 'saw'];
        const randomType = waveTypes[Math.floor(Math.random() * waveTypes.length)];
        drawWave(imageData, randomType);
      }

      ctx.putImageData(imageData, 0, 0);
      time += 0.05;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Audio control
  useEffect(() => {
    if (isPlayingAudio) {
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlayingAudio]);

  // Dropdown menu control
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (index) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setHoveredLink(index);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredLink(null);
    }, 300); // Increased delay for better usability
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Navigation Links */}
      <nav className="absolute top-0 right-0 p-6 z-20">
        <div className="flex flex-col space-y-4">
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
                  className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white/10 backdrop-blur-sm"
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

      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <h1 className="text-6xl font-bold mb-8 text-white font-neo-brutalist">SIGNAL-23</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => setIsPlayingAudio(!isPlayingAudio)} 
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            {isPlayingAudio ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
          </button>
        </div>
      </div>

      <audio ref={audioRef} loop>
        <source src="/pieces-website-mp3.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default App;
```

## File: src/styles/main.css

- Extension: .css
- Language: unknown
- Size: 106 bytes
- Created: 2024-10-21 11:35:01
- Modified: 2024-10-21 11:35:01

### Code

```unknown
@import 'fonts.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
@import 'responsive.css';
```

## File: src/styles/responsive.css

- Extension: .css
- Language: unknown
- Size: 317 bytes
- Created: 2024-10-21 10:38:37
- Modified: 2024-10-21 10:38:37

### Code

```unknown
/* responsive.css */
@media (min-width: 768px) {
    /* Tablet styles */
    body {
        padding: 40px;
    }
}

@media (min-width: 1024px) {
    /* Desktop styles */
    main {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
    }

    section {
        width: 48%;
    }
}
```

## File: src/styles/fonts.css

- Extension: .css
- Language: unknown
- Size: 1435 bytes
- Created: 2025-01-09 19:56:01
- Modified: 2025-01-09 19:56:01

### Code

```unknown
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');

@font-face {
  font-family: 'Neo Brutalist';
  src: url('../assets/fonts/Neo Brutalist.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'NeobruteTest4';
  src: url('../assets/fonts/NeobruteTest4.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'NeobruteTest5';
  src: url('../assets/fonts/NeobruteTest5.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}


@font-face {
  font-family: 'NeobruteTest6';
  src: url('../assets/fonts/NeobruteTest6.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'NeobruteTest7';
  src: url('../assets/fonts/NeobruteTest7.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'NeobruteTest8';
  src: url('../assets/fonts/NeobruteTest8.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Neobrutetest';
  src: url('../assets/fonts/NeoBruteTest.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}
```

## File: src/components/Portal/PortalShader.ts

- Extension: .ts
- Language: typescript
- Size: 4182 bytes
- Created: 2024-11-14 15:13:03
- Modified: 2024-11-14 15:13:03

### Code

```typescript
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
```

## File: src/components/Portal/Portal.tsx

- Extension: .tsx
- Language: typescript
- Size: 5197 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```typescript
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { noiseShader, vertexShader, fragmentShader } from './PortalShader';

interface PortalProps {
  isMobile: boolean;
  onClick?: () => void;
}

export const Portal: React.FC<PortalProps> = ({ isMobile, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);

  // Initialize Three.js scene
  const initThree = useCallback(() => {
    if (!canvasRef.current) return;

    // Clean up existing instances
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 7;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    rendererRef.current = renderer;

    // Geometry setup - reuse geometry
    const geometry = new THREE.PlaneGeometry(16, 9, 128, 128);

    // Material setup
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        mouse: { value: new THREE.Vector2(0.5, 0.5) },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        isMobile: { value: isMobile }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
    materialRef.current = material;

    // Mesh setup
    const portal = new THREE.Mesh(geometry, material);
    scene.add(portal);

    return () => {
      // Proper cleanup
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      
      // Clean up scene
      while(scene.children.length > 0) { 
        const object = scene.children[0];
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
        scene.remove(object);
      }
    };
  }, [isMobile]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (!rendererRef.current || !cameraRef.current || !materialRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    
    rendererRef.current.setSize(width, height);
    
    materialRef.current.uniforms.resolution.value.set(width, height);
    materialRef.current.uniforms.isMobile.value = width <= 768;
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !materialRef.current) return;

    timeRef.current += 0.01;
    materialRef.current.uniforms.time.value = timeRef.current;
    materialRef.current.uniforms.mouse.value.set(mouseRef.current.x, mouseRef.current.y);

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Mouse/touch event handlers
  const handleMouseMove = useCallback((event: MouseEvent) => {
    mouseRef.current.x = (event.clientX / window.innerWidth);
    mouseRef.current.y = 1 - (event.clientY / window.innerHeight);
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (event.touches.length > 0) {
      mouseRef.current.x = (event.touches[0].clientX / window.innerWidth);
      mouseRef.current.y = 1 - (event.touches[0].clientY / window.innerHeight);
    }
  }, []);

  // Setup effect
  useEffect(() => {
    const cleanup = initThree();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('resize', handleResize);

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      cleanup?.();
    };
  }, [initThree, handleMouseMove, handleTouchMove, handleResize, animate]);

  return (
    <canvas 
      ref={canvasRef}
      className="absolute inset-0 w-full h-full z-0"
    />
  );
};
```

## File: src/components/Navigation/NavigationLink.tsx

- Extension: .tsx
- Language: typescript
- Size: 1946 bytes
- Created: 2025-01-09 19:11:44
- Modified: 2025-01-09 19:11:44

### Code

```typescript
import React, { useState, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

interface Platform {
  name: string;
  url: string;
}

interface NavigationLinkProps {
  icon?: React.ReactNode;
  label: string;
  href: string;
  description?: string;
  platforms?: Platform[];
}

export const NavigationLink: React.FC<NavigationLinkProps> = ({
  icon,
  label,
  href,
  description,
  platforms
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href={href}
        className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </a>
      
      {platforms && isHovered && (
        <div 
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 rounded-md shadow-lg bg-white/10 backdrop-blur-sm"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="py-1">
            {platforms.map((platform, index) => (
              <a
                key={index}
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
  );
};
```

## File: src/components/Audio/AudioPlayer.tsx

- Extension: .tsx
- Language: typescript
- Size: 1296 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```typescript
import React, { useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  audioSource: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  isPlaying, 
  onPlayPause, 
  audioSource 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying]);

  return (
    <>
      <button 
        onClick={onPlayPause} 
        className="w-96 h-96 rounded-full opacity-0 hover:opacity-5 transition-opacity cursor-pointer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {/* Optional: Very faint icon that appears on hover */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {isPlaying ? 
            <Pause className="w-16 h-16 text-white" /> : 
            <Play className="w-16 h-16 text-white" />
          }
        </div>
      </button>
      <audio ref={audioRef} loop>
        <source src={audioSource} type="audio/mpeg" />
      </audio>
    </>
  );
};
```

## File: src/components/EnhancedNumberStation/EnhancedNumberStation.tsx

- Extension: .tsx
- Language: typescript
- Size: 5077 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```typescript
import React, { useState, useCallback, useEffect } from 'react';

interface NumberStationProps {
    isMobile: boolean;
    onGlitchChange: (isGlitching: boolean) => void;  // Added this prop
}

export const EnhancedNumberStation: React.FC<NumberStationProps> = ({ 
    isMobile, 
    onGlitchChange 
}) => {
    const BASE_OPACITY = 0.7;
    const HIDDEN_OPACITY = 0;
    
    const [sequence, setSequence] = useState([]);
    const [warning, setWarning] = useState('');
    const [glitchEffect, setGlitchEffect] = useState(false);
    
    const warnings = [
      "THIS PLACE IS A MESSAGE AND PART OF A SYSTEM OF MESSAGES",
      "WHAT IS HERE IS DANGEROUS AND REPULSIVE TO US",
      "THE DANGER IS STILL PRESENT IN YOUR TIME AS IT WAS IN OURS",
      "DO NOT DISTURB",
      "SIGNAL DETECTED",
      "TRANSMISSION ACTIVE",
      "DATA CORRUPTION DETECTED"
    ];
  
    // ... other functions remain the same ...
    const generateSequence = () => {
      const specialChars = ['0', '1', '█', '▓', '▒', '░'];
      return Array.from({ length: 8 }, () => ({
        value: specialChars[Math.floor(Math.random() * specialChars.length)],
        opacity: BASE_OPACITY,
        isGlitched: Math.random() > 0.8
      }));
    };
  
    const createGlitchEffect = useCallback((index) => {
      setSequence(prev => 
        prev.map((num, i) => 
          i === index ? {
            ...num,
            value: ['█', '▓', '▒', '░'][Math.floor(Math.random() * 4)],
            opacity: Math.random() * BASE_OPACITY + 0.3
          } : num
        )
      );
    }, []);
  
    const generatePattern = useCallback(async () => {
      const patternLength = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < patternLength; i++) {
        const indices = Array.from(
          { length: Math.floor(Math.random() * 3) + 1 },
          () => Math.floor(Math.random() * sequence.length)
        );
        await flashNumbers(indices, 200);
      }
    }, [sequence.length]);
  
    const flashNumbers = async (indices, duration) => {
      const shouldGlitch = Math.random() > 0.7;
      if (shouldGlitch) setGlitchEffect(true);
      
      indices.forEach(index => {
        setSequence(prev => 
          prev.map((num, i) => 
            i === index ? { ...num, opacity: BASE_OPACITY } : num
          )
        );
        if (shouldGlitch) createGlitchEffect(index);
      });
      
      await new Promise(r => setTimeout(r, duration));
      
      indices.forEach(index => {
        setSequence(prev => 
          prev.map((num, i) => 
            i === index ? { ...num, opacity: HIDDEN_OPACITY } : num
          )
        );
      });
      
      setGlitchEffect(false);
      await new Promise(r => setTimeout(r, duration * 0.5));
    };

    // Single warning interval effect
    useEffect(() => {
      const warningInterval = setInterval(() => {
        if (Math.random() > 0.4) {
          const newWarning = warnings[Math.floor(Math.random() * warnings.length)];
          console.log('Showing warning:', newWarning);
          setWarning(newWarning);
          onGlitchChange(true);  // Notify parent

          setTimeout(() => {
            setWarning('');
            onGlitchChange(false);  // Notify parent
          }, 2000);
        }
      }, 7000);
      
      return () => clearInterval(warningInterval);
    }, [onGlitchChange]);
  
    useEffect(() => {
      const runSequence = async () => {
        setSequence(generateSequence());
        await generatePattern();
        setTimeout(runSequence, Math.random() * 1000 + 2000);
      };
      
      runSequence();
    }, [generatePattern]);
  
    return (
      <div className="fixed top-0 left-0 w-full h-16 px-6 font-mono pointer-events-none">
        <div className={`h-full ${isMobile ? 'flex justify-between items-center' : 'flex flex-col justify-center'}`}>
          <div 
            className={`flex space-x-2 ${glitchEffect ? 'animate-pulse' : ''}`}
            style={{ 
              textShadow: glitchEffect ? '2px 2px 8px rgba(255,255,255,0.5)' : 'none',
              transform: glitchEffect ? 'translateX(-1px)' : 'none',
              transition: 'transform 0.1s'
            }}
          >
            {sequence.map((num, index) => (
              <span
                key={index}
                className="transition-all duration-100"
                style={{
                  opacity: num.opacity,
                  color: 'white',
                  transform: num.isGlitched ? 'translateY(1px)' : 'none',
                  textShadow: num.isGlitched ? '1px 1px 4px rgba(255,255,255,0.3)' : 'none'
                }}
              >
                {num.value}
              </span>
            ))}
          </div>
          {warning && (
            <div 
              className={`
                text-xs text-red-500 opacity-70 tracking-wider animate-fadeInOut
                ${isMobile ? 'ml-4 max-w-[160px]' : 'mt-2'}
              `}
            >
              {warning}
            </div>
          )}
        </div>
      </div>
    );
};
```

## File: src/components/GlitchOverlay/GlitchOverlay.tsx

- Extension: .tsx
- Language: typescript
- Size: 5675 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```typescript
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface GlitchOverlayProps {
  isActive: boolean;
  delay?: number;
}

export const GlitchOverlay: React.FC<GlitchOverlayProps> = ({ 
  isActive, 
  delay = 1000 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showEffect, setShowEffect] = useState(false);
  const artifactsRef = useRef<DigitalArtifact[]>([]);
  const noiseTextureRef = useRef<ImageData | null>(null);
  const frameRef = useRef(0);
  const animationRef = useRef<number>();
  
  // Pre-generate text options
  const GLITCH_TEXTS = [
    'SIGNAL DETECTED',
    'DATA CORRUPTION',
    'WARNING',
    'TRANSMISSION ACTIVE',
    'DO NOT DISTURB',
    'THIS PLACE IS A MESSAGE',
    'THE DANGER IS STILL PRESENT',
    '01010101',
    'SIGNAL-3'
  ];

  // Memoized noise texture generation
  const generateNoiseTexture = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const intensity = Math.random();
      const value = intensity > 0.5 ? 255 * (intensity * 0.8) : 0;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = Math.random() * 35;
    }
    
    return imageData;
  }, []);

  class DigitalArtifact {
    x: number;
    y: number;
    width: number;
    height: number;
    lifetime: number;
    maxLifetime: number;
    type: 'line' | 'text' | 'interference';
    intensity: number;
    text?: string;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.width = Math.random() * 200 + 50;
      this.height = Math.random() * 2 + 1;
      this.lifetime = 0;
      this.maxLifetime = Math.random() * 60 + 30;
      this.type = Math.random() > 0.6 ? 'line' : Math.random() > 0.5 ? 'text' : 'interference';
      this.intensity = Math.random() * 0.7 + 0.3;
      
      if (this.type === 'text') {
        this.text = GLITCH_TEXTS[Math.floor(Math.random() * GLITCH_TEXTS.length)];
      }
    }

    draw(ctx: CanvasRenderingContext2D) {
      const alpha = 1 - (this.lifetime / this.maxLifetime);
      ctx.globalAlpha = alpha * this.intensity;

      switch (this.type) {
        case 'line':
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(this.x, this.y, this.width, this.height);
          break;
        case 'text':
          ctx.font = '12px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(this.text || '', this.x, this.y);
          break;
        case 'interference':
          const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + 100);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(this.x, this.y, 2, 100);
          break;
      }

      ctx.globalAlpha = 1;
    }

    update() {
      this.lifetime++;
      return this.lifetime < this.maxLifetime;
    }
  }

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setShowEffect(true);
      }, delay);
      
      return () => {
        clearTimeout(timer);
        setShowEffect(false);
      };
    } else {
      setShowEffect(false);
    }
  }, [isActive, delay]);

  useEffect(() => {
    if (!showEffect || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Regenerate noise texture on resize
      noiseTextureRef.current = generateNoiseTexture(ctx, canvas.width, canvas.height);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      frameRef.current++;
      
      // Update noise texture every other frame
      if (frameRef.current % 2 === 0) {
        noiseTextureRef.current = generateNoiseTexture(ctx, canvas.width, canvas.height);
      }
      
      if (noiseTextureRef.current) {
        ctx.putImageData(noiseTextureRef.current, 0, 0);
      }

      // Scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let i = 0; i < canvas.height; i += 2) {
        ctx.fillRect(0, i, canvas.width, 1);
      }

      // Limit artifacts array size
      if (artifactsRef.current.length < 20 && Math.random() > 0.95) {
        artifactsRef.current.push(new DigitalArtifact(canvas));
      }

      // Update and draw artifacts
      artifactsRef.current = artifactsRef.current.filter(artifact => {
        if (artifact.update()) {
          artifact.draw(ctx);
          return true;
        }
        return false;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Clear artifacts on cleanup
      artifactsRef.current = [];
    };
  }, [showEffect, generateNoiseTexture]);
  
  if (!isActive) return null;
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 100,
        opacity: showEffect ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        mixBlendMode: 'screen'
      }}
    />
  );
};
```

## File: src/components/TextStack/TextStack.tsx

- Extension: .tsx
- Language: typescript
- Size: 4631 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```typescript
import React, { useEffect, useState } from 'react';

export const DistortedStack = ({ isPlayingAudio }) => {
    const [offset, setOffset] = useState(0);
    const fontFamilies = [
      'neo-brutalist6',
      'neo-brutalist6',
      'neo-brutalist4',
      'neo-brutalist5',
      'neo-brutalist6',
      'neo-brutalist7',
      'neo-brutalist8',
      'neo-brutalist9'
    ];

    useEffect(() => {
      const interval = setInterval(() => {
        setOffset(prev => (prev + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    }, []);
  
    return (
      <>
        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.85; }
            }
          `}
        </style>
        <div className="absolute right-0 lg:right-20 top-0 h-full flex flex-col justify-center">
          <div className="space-y-6 transform-gpu">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                style={{
                  ...i === 3 
                    ? {
                        WebkitTextStroke: '0.02px white',
                        color: 'black',
                        filter: 'url(#irregular-outline)'
                      }
                    : {
                        filter: isPlayingAudio ? 'url(#playing-effect)' : 'url(#default-effect)',
                        animation: `pulse ${2 + i * 0.1}s ease-in-out infinite`,
                        transition: 'filter 0.3s ease'
                      }
                }}
                className={`
                  text-4xl md:text-5xl lg:text-6xl 
                  font-bold 
                  font-${fontFamilies[i]}
                  transform-gpu
                  transition-all duration-300
                  ${i === 3 ? '' : 'text-white'}
                  px-6 lg:px-0
                `}
              >
                {i === 3 ? 'SIGNAL23' : (
                  <div 
                    style={{ transform: 'scale(-1, 1)' }} 
                    className="inline-block"
                  >
                    SIGNAL23
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
  
        <svg className="hidden">
          <defs>
            {/* Default effect with mild erosion */}
            <filter id="default-effect">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="1.2"
                numOctaves="5"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="12"
              />
              <feGaussianBlur stdDeviation=".3"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncG type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncB type="linear" slope="1.8" intercept="-0.2"/>
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic"/>
            </filter>
  
            {/* More intense effect for when playing */}
            <filter id="playing-effect">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="2.5"
                numOctaves="6"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="25"
              />
              <feGaussianBlur stdDeviation="1.5"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="2" intercept="-0.2"/>
                <feFuncG type="linear" slope="2" intercept="-0.2"/>
                <feFuncB type="linear" slope="2" intercept="-0.2"/>
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic"/>
            </filter>

            {/* Outline effect */}
            <filter id="irregular-outline">
              <feTurbulence 
                type="turbulence" 
                baseFrequency="0.7"
                numOctaves="3"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="1"
              />
              <feGaussianBlur stdDeviation="0.03"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.2"/>
                <feFuncG type="linear" slope="1.2"/>
                <feFuncB type="linear" slope="1.2"/>
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>
      </>
    );
  };
```

## File: src/assets/images/DALLE_2024-10-04_14.18.22_-_A_minimalistic_dystopian_landscape_with_only_a_few_faded_abstract_shapes_resembling_abandoned_buildings._The_structures_appear_ghostly_and_barely_visi.jpeg

- Extension: .jpeg
- Language: unknown
- Size: 0 bytes
- Created: 2024-10-21 10:41:37
- Modified: 2024-10-21 10:41:37

### Code

```unknown

```

## File: src/assets/images/DALL·E 2024-10-10 12.13.05 - Create a more impressionist, minimalistic, and ruin-like logo for the electronic duo 'Signal-23.' The design should evoke the feeling of abandoned.jpg

- Extension: .jpg
- Language: unknown
- Size: 0 bytes
- Created: 2024-10-21 10:41:48
- Modified: 2024-10-21 10:41:37

### Code

```unknown

```


```

## File: babel.config.json

- Extension: .json
- Language: json
- Size: 204 bytes
- Created: 2024-10-24 21:56:22
- Modified: 2024-10-24 21:56:22

### Code

```json
{
    "presets": [
      "@babel/preset-env",
      ["@babel/preset-react", {
        "runtime": "classic"  // Use classic runtime instead of automatic
      }],
      "@babel/preset-typescript"
    ]
  }
```

## File: .babelrc

- Extension: 
- Language: unknown
- Size: 65 bytes
- Created: 2024-10-23 20:20:46
- Modified: 2024-10-23 20:20:46

### Code

```unknown
{
    "presets": ["@babel/preset-env", "@babel/preset-react"]
  }
```

## File: tailwind.config.js

- Extension: .js
- Language: javascript
- Size: 1609 bytes
- Created: 2025-01-09 19:52:02
- Modified: 2025-01-09 19:52:02

### Code

```javascript
module.exports = {
  purge: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './src/styles/**/*.css'
  ],
  darkMode: false,
  theme: {
    extend: {
      fontFamily: {
        'neo-brutalist': ['Neo Brutalist', 'sans-serif'],
        'neo-brute-transparent': ['Neobrutetest', 'sans-serif'],
        'neo-brutalist4': ['NeobruteTest4', 'sans-serif'],
        'neo-brutalist5': ['NeobruteTest5', 'sans-serif'],
        'neo-brutalist6': ['NeobruteTest6', 'sans-serif'],
        'neo-brutalist7': ['NeobruteTest7', 'sans-serif'],
        'neo-brutalist8': ['NeobruteTest8', 'sans-serif'],
        'neo-brutalist9': ['NeobruteTest9', 'sans-serif'],
        'ibm-mono': ['IBM Plex Mono', 'monospace'],
        'space-mono': ['Space Mono', 'monospace'],
      },
      animation: {
        'flash': 'flash 0.5s ease-in-out infinite',
        'tear': 'tear 0.2s ease-in-out infinite',
        'scanline': 'scanline 1s linear infinite',
        'flicker': 'flicker 0.2s ease-in-out infinite',
      },
      keyframes: {
        flash: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
        tear: {
          '0%, 100%': { transform: 'translateY(0) skewY(-3deg)' },
          '50%': { transform: 'translateY(5px) skewY(-2deg)' },
        },
        scanline: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  variants: {
    extend: {}
  },
  plugins: [],
}

```

## File: netlify.toml

- Extension: .toml
- Language: toml
- Size: 280 bytes
- Created: 2024-10-21 21:19:59
- Modified: 2024-10-21 21:19:59

### Code

```toml
[build]
  publish = "build"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "14"

[[headers]]
  for = "/*"
    [headers.values]
    Access-Control-Allow-Origin = "*"

[[headers]]
  for = "*.mp3"
    [headers.values]
    Cache-Control = "public, max-age=31536000"
```

## File: webpack.config.js

- Extension: .js
- Language: javascript
- Size: 1975 bytes
- Created: 2025-01-27 16:05:26
- Modified: 2025-01-27 16:05:26

### Code

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',  // Changed from index.js to index.tsx
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,  // Add TypeScript file handling
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
                '@babel/preset-typescript'  // Add TypeScript preset
              ]
            }
          }
        ]
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(mp3|wav)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]'
        }
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '',
          globOptions: {
            ignore: ['**/index.html'],
          },
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.css'],  // Add TypeScript extensions
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    hot: true,
    port: 8080,
    host: '0.0.0.0',
    historyApiFallback: true,
  },
};
```

## File: README.md

- Extension: .md
- Language: markdown
- Size: 4184 bytes
- Created: 2024-10-22 09:16:35
- Modified: 2024-10-22 09:16:35

### Code

```markdown
# SIGNAL-23 Website

A React-based website for the electronic music duo Signal-23, featuring an interactive noise background with dynamic signal effects.

## Installation

1. Install Docker:
   - Windows/Mac: Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Linux: Follow your distribution's instructions for installing Docker Engine

2. Clone the repository:
```bash
git clone https://github.com/yourusername/signal-23-website.git
cd signal-23-website
```

3. Run with Docker:
```bash
docker compose up --build
```

4. Open your browser and go to: http://localhost:8080

## Project Structure

### Root Configuration Files
- `docker-compose.yml` - Docker Compose configuration for local development
- `Dockerfile` - Container configuration for building the development environment
- `netlify.toml` - Netlify deployment configuration
- `package.json` - Node.js project configuration and dependencies
- `postcss.config.js` - PostCSS configuration for CSS processing
- `tailwind.config.js` - Tailwind CSS customization and configuration
- `webpack.config.js` - Webpack build and development server configuration

### Source Code (`/src`)
- `index.js` - Application entry point
- `App.js` - Main React component with noise effect and navigation
- `App.lines.js` - Alternative version with line effects
- `App.static.js` - Static version of the main component

#### Components (`/src/components`)
- `AudioPlayer.js` - Audio playback component
- `MusicLinks.js` - Music platform links component
- `SocialLinks.js` - Social media links component

#### Styles (`/src/styles`)
- `main.css` - Primary stylesheet with Tailwind imports
- `fonts.css` - Custom font declarations
- `responsive.css` - Media queries and responsive styling

#### Assets (`/src/assets`)
- `/fonts` - Custom fonts including Neo Brutalist
- `/images` - Project images and artwork

### Public Files (`/public`)
- `index.html` - HTML entry point
- `abridged_tim0.mp3` - Audio content

## Key Technologies

- React
- Tailwind CSS
- Docker
- Webpack
- Netlify for deployment

## File Details

### Configuration Files
```javascript
// webpack.config.js
// Configures build process, including:
// - JavaScript/JSX processing
// - CSS/PostCSS processing
// - Asset handling (fonts, audio)
// - Development server setup

// tailwind.config.js
// Customizes Tailwind CSS, including:
// - Custom font configurations
// - Theme extensions
// - Responsive design utilities

// postcss.config.js
// Sets up PostCSS plugins:
// - Tailwind CSS
// - Autoprefixer for browser compatibility
```

### Core React Components
```javascript
// src/index.js
// Application entry point:
// - Renders main App component
// - Imports global styles

// src/App.js
// Main application component:
// - Implements noise background effect
// - Handles audio playback
// - Manages navigation and dropdowns
```

### Styling
```css
/* styles/main.css */
// Primary stylesheet:
// - Imports Tailwind directives
// - Imports custom fonts
// - Imports responsive styles

/* styles/responsive.css */
// Responsive design rules:
// - Tablet adaptations (768px+)
// - Desktop layouts (1024px+)
```

### Docker Configuration
```yaml
# docker-compose.yml
# Development environment setup:
# - Port mapping (8080)
# - Volume mounts for hot reloading
# - Environment variables

# Dockerfile
# Container configuration:
# - Node.js setup
# - Dependency installation
# - Development server startup
```

## Development

The project uses Docker for consistent development environments. The development server includes:
- Hot reloading
- Source maps
- Development build optimizations

To stop the development server:
```bash
docker compose down
```

## Deployment

The site is deployed on Netlify. The `netlify.toml` configuration handles:
- Build commands
- Environment setup
- Headers for audio file caching
- CORS configuration

## Troubleshooting

If you encounter issues:
1. Check Docker is running
2. Ensure ports are available (8080)
3. Check console for build errors
4. Clear Docker cache if needed:
   ```bash
   docker compose down
   docker compose build --no-cache
   ```

For other issues, please open a GitHub issue.
```

## File: .dockerignore

- Extension: 
- Language: unknown
- Size: 358 bytes
- Created: 2024-11-15 10:32:20
- Modified: 2024-11-15 10:32:20

### Code

```unknown
node_modules
npm-debug.log
build
# Version control
.git
.gitignore

# Dependencies
node_modules
ai_be/venv

# Environment variables
.env
.env.local
.env.*.local

# IDE files
.idea
.vscode
*.swp
*.swo

# Build outputs
dist
build
*.pyc
__pycache__
.pytest_cache

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# Docker
Dockerfile*
docker-compose*
```

## File: package.json

- Extension: .json
- Language: json
- Size: 1101 bytes
- Created: 2025-01-27 16:01:05
- Modified: 2025-01-27 16:01:05

### Code

```json
{
  "name": "signal-23-website",
  "version": "1.0.0",
  "scripts": {
    "start": "webpack serve --mode development --host 0.0.0.0 --port 8080",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "lucide-react": "^0.263.1",
    "three": "^0.157.0",
    "ts-loader": "^9.4.2",
    "simplex-noise": "^4.0.1",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@babel/core": "^7.15.0",
    "@babel/preset-env": "^7.15.0",
    "@babel/preset-react": "^7.14.5",
    "@babel/preset-typescript": "^7.15.0", 
    "@types/react": "^17.0.0",           
    "@types/react-dom": "^17.0.0",
    "@types/three": "^0.157.0",
    "typescript": "^4.5.0",
    "autoprefixer": "^10.3.1",
    "babel-loader": "^8.2.2",
    "css-loader": "^6.2.0",
    "html-webpack-plugin": "^5.3.2",
    "postcss": "^8.3.6",
    "postcss-loader": "^6.1.1",
    "style-loader": "^3.2.1",
    "tailwindcss": "^2.2.7",
    "webpack": "^5.50.0",
    "webpack-cli": "^4.8.0",
    "webpack-dev-server": "^4.0.0",
    "copy-webpack-plugin": "^11.0.0"
  }
}
```

## File: tsconfig.json

- Extension: .json
- Language: json
- Size: 795 bytes
- Created: 2024-10-24 21:56:22
- Modified: 2024-10-24 21:56:22

### Code

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "jsx": "react",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    },
    "noImplicitAny": false,
    "outDir": "./dist",  // Add output directory
    "sourceMap": true    // Enable source maps
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.js",
    "src/**/*.jsx"
  ],
  "exclude": ["node_modules"]
}
```

## File: docker-compose.yml

- Extension: .yml
- Language: yaml
- Size: 238 bytes
- Created: 2024-11-15 10:32:20
- Modified: 2024-11-15 10:32:20

### Code

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "8080:8080"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true
```

## File: postcss.config.js

- Extension: .js
- Language: javascript
- Size: 104 bytes
- Created: 2024-10-21 11:32:00
- Modified: 2024-10-21 11:32:00

### Code

```javascript
module.exports = {
    plugins: [
      require('tailwindcss'),
      require('autoprefixer'),
    ]
  }
```

## File: Dockerfile.frontend

- Extension: .frontend
- Language: unknown
- Size: 772 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```unknown
FROM node:14

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Copy TypeScript config
COPY tsconfig.json ./

# Clean npm cache and remove existing node_modules (if any)
RUN npm cache clean --force && \
    rm -rf node_modules

# Install dependencies including TypeScript and Babel presets
RUN npm install --save-dev typescript @types/react @types/react-dom @types/three @babel/preset-typescript

# Install all other dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Ensure the public directory exists
RUN mkdir -p public

# Copy the audio file to the public directory
COPY public/abridged_tim0.mp3 public/

# Expose the port your app runs on
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
```

## File: public/index.html

- Extension: .html
- Language: html
- Size: 299 bytes
- Created: 2024-11-15 10:32:20
- Modified: 2024-11-15 10:32:20

### Code

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="/favicon logo 32x32.png" />
    <title>Signal-23</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>
```

## File: src/index.tsx

- Extension: .tsx
- Language: typescript
- Size: 224 bytes
- Created: 2024-10-24 21:56:22
- Modified: 2024-10-24 21:56:22

### Code

```typescript
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/main.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
```

## File: src/App.tsx

- Extension: .tsx
- Language: typescript
- Size: 4117 bytes
- Created: 2025-01-27 16:21:24
- Modified: 2025-01-27 16:21:24

### Code

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Terminal } from './components/Terminal/Terminal';
import { Portal } from './components/Portal/Portal';
import { AudioPlayer } from './components/Audio/AudioPlayer';
import { NavigationLink } from './components/Navigation/NavigationLink';
import { DistortedStack } from './components/TextStack/TextStack';
import { EnhancedNumberStation } from './components/EnhancedNumberStation/EnhancedNumberStation';
import { GlitchOverlay } from './components/GlitchOverlay/GlitchOverlay';

// Home component (previously App content)
const Home = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showGlitch, setShowGlitch] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { 
      label: "music@signal23.net",
      description: "Get in touch" 
    }
  ];

  // Handle portal click to navigate to terminal
  const handlePortalClick = () => {
    console.log('Navigating to terminal');
    navigate('/terminal');
  };

  return (
    <>
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <div className="fixed inset-0 bg-black -z-10" />
        
        <div className="relative h-full">
          <div className="absolute inset-0 z-20">
            <AudioPlayer 
              isPlaying={isPlayingAudio}
              onPlayPause={() => setIsPlayingAudio(!isPlayingAudio)}
              audioSource="/pieces-website-mp3.mp3"
            />
          </div>

          {/* Make Portal clickable */}
          <Portal 
            isMobile={isMobile} 
            onClick={handlePortalClick}
          />

          <EnhancedNumberStation 
            isMobile={isMobile}
            onGlitchChange={setShowGlitch}
          />

          <div className="hidden md:grid grid-cols-12 h-full relative z-10">
            <div className="col-span-7 xl:col-span-8 relative">
            </div>

            <div className="col-span-5 xl:col-span-4 relative">
              <div className="h-full">
                <DistortedStack isPlayingAudio={isPlayingAudio} />
              </div>
            </div>
          </div>

          <div className="md:hidden flex flex-col items-center h-full relative z-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-white font-neo-brute-transparent mt-12">
              SIGNAL-3
            </h1>
          </div>

          <nav className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <div className="flex justify-center space-x-8 opacity-60 font-ibm-mono">
              {navLinks.map((link, index) => (
                <NavigationLink key={index} {...link} />
              ))}
            </div>
          </nav>
        </div>

        <svg className="hidden">
          <defs>
            <filter id="eroded-blur">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="1.2"
                numOctaves="5"
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="12"
              />
              <feGaussianBlur stdDeviation=".3"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncG type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncB type="linear" slope="1.8" intercept="-0.2"/>
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic"/>
            </filter>
          </defs>
        </svg>
      </div>

      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
        <GlitchOverlay isActive={showGlitch} />
      </div>
    </>
  );
};

// Main App component with routing
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/terminal" element={<Terminal />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
```

## File: DEPRECATED/static_app.tsx

- Extension: .tsx
- Language: typescript
- Size: 7855 bytes
- Created: 2024-11-15 10:32:20
- Modified: 2024-11-15 10:32:20

### Code

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Music2, Mail, Info, ExternalLink } from 'lucide-react';

const App = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);

  const navLinks = [
    { 
      icon: <Info className="w-5 h-5" />,
      label: "INFO",
      href: "#",
      description: "About Signal-23" 
    },
    { 
      icon: <Mail className="w-5 h-5" />,
      label: "CONTACT",
      href: "mailto:your@email.com",
      description: "Get in touch" 
    },
    { 
      icon: <Music2 className="w-5 h-5" />,
      label: "MUSIC",
      href: "#",
      description: "Listen on platforms",
      platforms: [
        { name: "Spotify", url: "#" },
        { name: "Apple Music", url: "#" },
        { name: "Bandcamp", url: "#" },
        { name: "SoundCloud", url: "#" }
      ]
    }
  ];

  // Canvas and noise effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;     // red
        data[i + 1] = value; // green
        data[i + 2] = value; // blue
        data[i + 3] = 255;   // alpha
      }

      return imageData;
    };

    const drawSignal = (imageData) => {
      const data = imageData.data;
      const signalPhrase = "SIGNAL-23";
      const signalStart = Math.random() * (data.length / 4 - signalPhrase.length * 8);

      for (let i = 0; i < signalPhrase.length; i++) {
        const charCode = signalPhrase.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
          const bit = (charCode >> j) & 1;
          const index = (signalStart + i * 8 + j) * 4;
          if (bit && index < data.length - 4) {
            data[index] = 255;     // red
            data[index + 1] = 0;   // green
            data[index + 2] = 0;   // blue
          }
        }
      }
    };

    const drawWave = (imageData, type) => {
      const data = imageData.data;
      const width = canvas.width;
      const startY = Math.random() * canvas.height;
      const amplitude = Math.random() * 30 + 10;
      const frequency = Math.random() * 0.02 + 0.01;
      const thickness = Math.floor(Math.random() * 3) + 1;

      for (let x = 0; x < width; x++) {
        let y;

        switch(type) {
          case 'sine':
            y = startY + Math.sin(x * frequency + time) * amplitude;
            break;
          case 'triangle':
            y = startY + (Math.abs(((x * frequency + time) % (2 * Math.PI)) - Math.PI) - Math.PI/2) * amplitude/2;
            break;
          case 'saw':
            y = startY + ((x * frequency + time) % Math.PI) * amplitude/Math.PI;
            break;
          default:
            y = startY + Math.sin(x * frequency + time) * amplitude;
        }

        for (let t = -thickness; t <= thickness; t++) {
          const yPos = Math.floor(y + t);
          if (yPos >= 0 && yPos < canvas.height) {
            const index = (yPos * width + x) * 4;
            if (index < data.length - 4) {
              data[index] = 255;     // white waves
              data[index + 1] = 255;
              data[index + 2] = 255;
            }
          }
        }
      }
    };

    const animate = () => {
      const imageData = generateNoise();

      if (Math.random() < 0.1) {
        drawSignal(imageData);
      }

      if (Math.random() < 0.2) {
        const waveTypes = ['sine', 'triangle', 'saw'];
        const randomType = waveTypes[Math.floor(Math.random() * waveTypes.length)];
        drawWave(imageData, randomType);
      }

      ctx.putImageData(imageData, 0, 0);
      time += 0.05;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Audio control
  useEffect(() => {
    if (isPlayingAudio) {
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlayingAudio]);

  // Dropdown menu control
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (index) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setHoveredLink(index);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredLink(null);
    }, 300); // Increased delay for better usability
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Navigation Links */}
      <nav className="absolute top-0 right-0 p-6 z-20">
        <div className="flex flex-col space-y-4">
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
                  className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white/10 backdrop-blur-sm"
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

      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <h1 className="text-6xl font-bold mb-8 text-white font-neo-brutalist">SIGNAL-23</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => setIsPlayingAudio(!isPlayingAudio)} 
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            {isPlayingAudio ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
          </button>
        </div>
      </div>

      <audio ref={audioRef} loop>
        <source src="/pieces-website-mp3.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default App;
```

## File: src/styles/main.css

- Extension: .css
- Language: unknown
- Size: 254 bytes
- Created: 2025-01-27 16:16:57
- Modified: 2025-01-27 16:16:57

### Code

```unknown
@import 'fonts.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
@import 'responsive.css';


/* Reset default margins and padding */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#root {
  height: 100vh;
  width: 100vw;
}
```

## File: src/styles/responsive.css

- Extension: .css
- Language: unknown
- Size: 317 bytes
- Created: 2024-10-21 10:38:37
- Modified: 2024-10-21 10:38:37

### Code

```unknown
/* responsive.css */
@media (min-width: 768px) {
    /* Tablet styles */
    body {
        padding: 40px;
    }
}

@media (min-width: 1024px) {
    /* Desktop styles */
    main {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
    }

    section {
        width: 48%;
    }
}
```

## File: src/styles/fonts.css

- Extension: .css
- Language: unknown
- Size: 1435 bytes
- Created: 2025-01-09 19:56:01
- Modified: 2025-01-09 19:56:01

### Code

```unknown
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');

@font-face {
  font-family: 'Neo Brutalist';
  src: url('../assets/fonts/Neo Brutalist.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'NeobruteTest4';
  src: url('../assets/fonts/NeobruteTest4.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'NeobruteTest5';
  src: url('../assets/fonts/NeobruteTest5.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}


@font-face {
  font-family: 'NeobruteTest6';
  src: url('../assets/fonts/NeobruteTest6.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'NeobruteTest7';
  src: url('../assets/fonts/NeobruteTest7.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'NeobruteTest8';
  src: url('../assets/fonts/NeobruteTest8.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Neobrutetest';
  src: url('../assets/fonts/NeoBruteTest.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}
```

## File: src/components/Portal/PortalShader.ts

- Extension: .ts
- Language: typescript
- Size: 4182 bytes
- Created: 2024-11-14 15:13:03
- Modified: 2024-11-14 15:13:03

### Code

```typescript
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
```

## File: src/components/Portal/Portal.tsx

- Extension: .tsx
- Language: typescript
- Size: 6261 bytes
- Created: 2025-01-27 16:44:12
- Modified: 2025-01-27 16:44:12

### Code

```typescript
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { noiseShader, vertexShader, fragmentShader } from './PortalShader';

interface PortalProps {
  isMobile: boolean;
  onClick?: () => void;
}

export const Portal: React.FC<PortalProps> = ({ isMobile, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    console.log('Portal clicked');
    if (onClick) {
      onClick();
    }
  };

  // Initialize Three.js scene
  const initThree = useCallback(() => {
    if (!canvasRef.current) return;

    // Clean up existing instances
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 7;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    rendererRef.current = renderer;

    // Geometry setup - reuse geometry
    const geometry = new THREE.PlaneGeometry(16, 9, 128, 128);

    // Material setup
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        mouse: { value: new THREE.Vector2(0.5, 0.5) },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        isMobile: { value: isMobile }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
    materialRef.current = material;

    // Mesh setup
    const portal = new THREE.Mesh(geometry, material);
    scene.add(portal);

    return () => {
      // Proper cleanup
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      
      // Clean up scene
      while(scene.children.length > 0) { 
        const object = scene.children[0];
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
        scene.remove(object);
      }
    };
  }, [isMobile]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (!rendererRef.current || !cameraRef.current || !materialRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    
    rendererRef.current.setSize(width, height);
    
    materialRef.current.uniforms.resolution.value.set(width, height);
    materialRef.current.uniforms.isMobile.value = width <= 768;
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !materialRef.current) return;

    timeRef.current += 0.01;
    materialRef.current.uniforms.time.value = timeRef.current;
    materialRef.current.uniforms.mouse.value.set(mouseRef.current.x, mouseRef.current.y);

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Mouse/touch event handlers
  const handleMouseMove = useCallback((event: MouseEvent) => {
    mouseRef.current.x = (event.clientX / window.innerWidth);
    mouseRef.current.y = 1 - (event.clientY / window.innerHeight);
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (event.touches.length > 0) {
      mouseRef.current.x = (event.touches[0].clientX / window.innerWidth);
      mouseRef.current.y = 1 - (event.touches[0].clientY / window.innerHeight);
    }
  }, []);

  // Setup effect
  useEffect(() => {
    const cleanup = initThree();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('resize', handleResize);

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      cleanup?.();
    };
  }, [initThree, handleMouseMove, handleTouchMove, handleResize, animate]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0"
      />
      {/* Clickable portal area */}
      <div className="absolute inset-0 flex items-center z-20 pointer-events-auto">
        <div 
          className="ml-[33%] w-[400px] h-[500px] cursor-pointer"
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ 
            border: isHovered ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,0,0,0.1)',
            background: isHovered ? 'rgba(255,255,255,0.02)' : 'rgba(255,0,0,0.02)'
          }}
        >
          <div className="text-white/30 font-mono text-sm absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {isHovered ? 'Enter' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

```

## File: src/components/Navigation/NavigationLink.tsx

- Extension: .tsx
- Language: typescript
- Size: 1946 bytes
- Created: 2025-01-09 19:11:44
- Modified: 2025-01-09 19:11:44

### Code

```typescript
import React, { useState, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

interface Platform {
  name: string;
  url: string;
}

interface NavigationLinkProps {
  icon?: React.ReactNode;
  label: string;
  href: string;
  description?: string;
  platforms?: Platform[];
}

export const NavigationLink: React.FC<NavigationLinkProps> = ({
  icon,
  label,
  href,
  description,
  platforms
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href={href}
        className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </a>
      
      {platforms && isHovered && (
        <div 
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 rounded-md shadow-lg bg-white/10 backdrop-blur-sm"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="py-1">
            {platforms.map((platform, index) => (
              <a
                key={index}
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
  );
};
```

## File: src/components/Terminal/Terminal.tsx

- Extension: .tsx
- Language: typescript
- Size: 3917 bytes
- Created: 2025-01-27 16:16:29
- Modified: 2025-01-27 16:16:29

### Code

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const Terminal: React.FC = () => {
  const navigate = useNavigate();
  
  const handleExit = () => {
    navigate('/');
  };
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([
    { type: 'system', content: 'SIGNAL-23 Terminal [Version 1.0.0]' },
    { type: 'system', content: '(c) 2025 SIGNAL-23. All rights reserved.' },
    { type: 'system', content: 'Type "help" for available commands.' },
    { type: 'prompt', content: '>' }
  ]);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  const commands = {
    exit: () => {
      handleExit();
      return ['Exiting terminal...'];
    },
    help: () => [
      'Available commands:',
      'clear    - Clear the terminal',
      'echo     - Echo a message',
      'date     - Display current date',
      'help     - Show this help message',
      'exit     - Return to main page',
      'whoami   - Display current user',
      'signal   - Display SIGNAL-23 information'
    ],
    clear: () => [],
    date: () => [new Date().toLocaleString()],
    whoami: () => ['SIGNAL-23_USER'],
    signal: () => [
      'SIGNAL-23',
      '----------',
      'Electronic music duo',
      'Established: 2024',
      'Status: Active',
      'Location: [REDACTED]'
    ],
    echo: (args) => [args.join(' ')]
  };

  const handleCommand = (cmd) => {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    if (command === '') {
      return [''];
    }
    
    if (command === 'clear') {
      setOutput([]);
      return [];
    }
    
    if (commands[command]) {
      return commands[command](args);
    }
    
    return [`Command not found: ${command}`];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newOutput = [
      ...output,
      { type: 'command', content: input }
    ];
    
    const result = handleCommand(input);
    result.forEach(line => {
      newOutput.push({ type: 'output', content: line });
    });
    
    newOutput.push({ type: 'prompt', content: '>' });
    
    setOutput(newOutput);
    setInput('');
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [output]);

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-black p-4 font-mono text-green-500 overflow-hidden"
      onClick={handleFocus}
      style={{ margin: 0 }}
    >
      <div 
        ref={terminalRef}
        className="h-full overflow-y-auto"
      >
        {output.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {line.type === 'prompt' ? (
              <div className="flex">
                <span>{line.content}</span>
                {i === output.length - 1 && (
                  <form onSubmit={handleSubmit} className="flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full bg-transparent outline-none ml-1 text-green-500"
                      autoFocus
                    />
                  </form>
                )}
              </div>
            ) : (
              <div className={`${
                line.type === 'system' ? 'text-green-600' : 
                line.type === 'command' ? 'pl-1' : ''
              }`}>
                {line.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Terminal;
```

## File: src/components/Audio/AudioPlayer.tsx

- Extension: .tsx
- Language: typescript
- Size: 1296 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```typescript
import React, { useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  audioSource: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  isPlaying, 
  onPlayPause, 
  audioSource 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying]);

  return (
    <>
      <button 
        onClick={onPlayPause} 
        className="w-96 h-96 rounded-full opacity-0 hover:opacity-5 transition-opacity cursor-pointer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {/* Optional: Very faint icon that appears on hover */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {isPlaying ? 
            <Pause className="w-16 h-16 text-white" /> : 
            <Play className="w-16 h-16 text-white" />
          }
        </div>
      </button>
      <audio ref={audioRef} loop>
        <source src={audioSource} type="audio/mpeg" />
      </audio>
    </>
  );
};
```

## File: src/components/EnhancedNumberStation/EnhancedNumberStation.tsx

- Extension: .tsx
- Language: typescript
- Size: 5077 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```typescript
import React, { useState, useCallback, useEffect } from 'react';

interface NumberStationProps {
    isMobile: boolean;
    onGlitchChange: (isGlitching: boolean) => void;  // Added this prop
}

export const EnhancedNumberStation: React.FC<NumberStationProps> = ({ 
    isMobile, 
    onGlitchChange 
}) => {
    const BASE_OPACITY = 0.7;
    const HIDDEN_OPACITY = 0;
    
    const [sequence, setSequence] = useState([]);
    const [warning, setWarning] = useState('');
    const [glitchEffect, setGlitchEffect] = useState(false);
    
    const warnings = [
      "THIS PLACE IS A MESSAGE AND PART OF A SYSTEM OF MESSAGES",
      "WHAT IS HERE IS DANGEROUS AND REPULSIVE TO US",
      "THE DANGER IS STILL PRESENT IN YOUR TIME AS IT WAS IN OURS",
      "DO NOT DISTURB",
      "SIGNAL DETECTED",
      "TRANSMISSION ACTIVE",
      "DATA CORRUPTION DETECTED"
    ];
  
    // ... other functions remain the same ...
    const generateSequence = () => {
      const specialChars = ['0', '1', '█', '▓', '▒', '░'];
      return Array.from({ length: 8 }, () => ({
        value: specialChars[Math.floor(Math.random() * specialChars.length)],
        opacity: BASE_OPACITY,
        isGlitched: Math.random() > 0.8
      }));
    };
  
    const createGlitchEffect = useCallback((index) => {
      setSequence(prev => 
        prev.map((num, i) => 
          i === index ? {
            ...num,
            value: ['█', '▓', '▒', '░'][Math.floor(Math.random() * 4)],
            opacity: Math.random() * BASE_OPACITY + 0.3
          } : num
        )
      );
    }, []);
  
    const generatePattern = useCallback(async () => {
      const patternLength = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < patternLength; i++) {
        const indices = Array.from(
          { length: Math.floor(Math.random() * 3) + 1 },
          () => Math.floor(Math.random() * sequence.length)
        );
        await flashNumbers(indices, 200);
      }
    }, [sequence.length]);
  
    const flashNumbers = async (indices, duration) => {
      const shouldGlitch = Math.random() > 0.7;
      if (shouldGlitch) setGlitchEffect(true);
      
      indices.forEach(index => {
        setSequence(prev => 
          prev.map((num, i) => 
            i === index ? { ...num, opacity: BASE_OPACITY } : num
          )
        );
        if (shouldGlitch) createGlitchEffect(index);
      });
      
      await new Promise(r => setTimeout(r, duration));
      
      indices.forEach(index => {
        setSequence(prev => 
          prev.map((num, i) => 
            i === index ? { ...num, opacity: HIDDEN_OPACITY } : num
          )
        );
      });
      
      setGlitchEffect(false);
      await new Promise(r => setTimeout(r, duration * 0.5));
    };

    // Single warning interval effect
    useEffect(() => {
      const warningInterval = setInterval(() => {
        if (Math.random() > 0.4) {
          const newWarning = warnings[Math.floor(Math.random() * warnings.length)];
          console.log('Showing warning:', newWarning);
          setWarning(newWarning);
          onGlitchChange(true);  // Notify parent

          setTimeout(() => {
            setWarning('');
            onGlitchChange(false);  // Notify parent
          }, 2000);
        }
      }, 7000);
      
      return () => clearInterval(warningInterval);
    }, [onGlitchChange]);
  
    useEffect(() => {
      const runSequence = async () => {
        setSequence(generateSequence());
        await generatePattern();
        setTimeout(runSequence, Math.random() * 1000 + 2000);
      };
      
      runSequence();
    }, [generatePattern]);
  
    return (
      <div className="fixed top-0 left-0 w-full h-16 px-6 font-mono pointer-events-none">
        <div className={`h-full ${isMobile ? 'flex justify-between items-center' : 'flex flex-col justify-center'}`}>
          <div 
            className={`flex space-x-2 ${glitchEffect ? 'animate-pulse' : ''}`}
            style={{ 
              textShadow: glitchEffect ? '2px 2px 8px rgba(255,255,255,0.5)' : 'none',
              transform: glitchEffect ? 'translateX(-1px)' : 'none',
              transition: 'transform 0.1s'
            }}
          >
            {sequence.map((num, index) => (
              <span
                key={index}
                className="transition-all duration-100"
                style={{
                  opacity: num.opacity,
                  color: 'white',
                  transform: num.isGlitched ? 'translateY(1px)' : 'none',
                  textShadow: num.isGlitched ? '1px 1px 4px rgba(255,255,255,0.3)' : 'none'
                }}
              >
                {num.value}
              </span>
            ))}
          </div>
          {warning && (
            <div 
              className={`
                text-xs text-red-500 opacity-70 tracking-wider animate-fadeInOut
                ${isMobile ? 'ml-4 max-w-[160px]' : 'mt-2'}
              `}
            >
              {warning}
            </div>
          )}
        </div>
      </div>
    );
};
```

## File: src/components/GlitchOverlay/GlitchOverlay.tsx

- Extension: .tsx
- Language: typescript
- Size: 5675 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```typescript
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface GlitchOverlayProps {
  isActive: boolean;
  delay?: number;
}

export const GlitchOverlay: React.FC<GlitchOverlayProps> = ({ 
  isActive, 
  delay = 1000 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showEffect, setShowEffect] = useState(false);
  const artifactsRef = useRef<DigitalArtifact[]>([]);
  const noiseTextureRef = useRef<ImageData | null>(null);
  const frameRef = useRef(0);
  const animationRef = useRef<number>();
  
  // Pre-generate text options
  const GLITCH_TEXTS = [
    'SIGNAL DETECTED',
    'DATA CORRUPTION',
    'WARNING',
    'TRANSMISSION ACTIVE',
    'DO NOT DISTURB',
    'THIS PLACE IS A MESSAGE',
    'THE DANGER IS STILL PRESENT',
    '01010101',
    'SIGNAL-3'
  ];

  // Memoized noise texture generation
  const generateNoiseTexture = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const intensity = Math.random();
      const value = intensity > 0.5 ? 255 * (intensity * 0.8) : 0;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = Math.random() * 35;
    }
    
    return imageData;
  }, []);

  class DigitalArtifact {
    x: number;
    y: number;
    width: number;
    height: number;
    lifetime: number;
    maxLifetime: number;
    type: 'line' | 'text' | 'interference';
    intensity: number;
    text?: string;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.width = Math.random() * 200 + 50;
      this.height = Math.random() * 2 + 1;
      this.lifetime = 0;
      this.maxLifetime = Math.random() * 60 + 30;
      this.type = Math.random() > 0.6 ? 'line' : Math.random() > 0.5 ? 'text' : 'interference';
      this.intensity = Math.random() * 0.7 + 0.3;
      
      if (this.type === 'text') {
        this.text = GLITCH_TEXTS[Math.floor(Math.random() * GLITCH_TEXTS.length)];
      }
    }

    draw(ctx: CanvasRenderingContext2D) {
      const alpha = 1 - (this.lifetime / this.maxLifetime);
      ctx.globalAlpha = alpha * this.intensity;

      switch (this.type) {
        case 'line':
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(this.x, this.y, this.width, this.height);
          break;
        case 'text':
          ctx.font = '12px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(this.text || '', this.x, this.y);
          break;
        case 'interference':
          const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + 100);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(this.x, this.y, 2, 100);
          break;
      }

      ctx.globalAlpha = 1;
    }

    update() {
      this.lifetime++;
      return this.lifetime < this.maxLifetime;
    }
  }

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setShowEffect(true);
      }, delay);
      
      return () => {
        clearTimeout(timer);
        setShowEffect(false);
      };
    } else {
      setShowEffect(false);
    }
  }, [isActive, delay]);

  useEffect(() => {
    if (!showEffect || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Regenerate noise texture on resize
      noiseTextureRef.current = generateNoiseTexture(ctx, canvas.width, canvas.height);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      frameRef.current++;
      
      // Update noise texture every other frame
      if (frameRef.current % 2 === 0) {
        noiseTextureRef.current = generateNoiseTexture(ctx, canvas.width, canvas.height);
      }
      
      if (noiseTextureRef.current) {
        ctx.putImageData(noiseTextureRef.current, 0, 0);
      }

      // Scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let i = 0; i < canvas.height; i += 2) {
        ctx.fillRect(0, i, canvas.width, 1);
      }

      // Limit artifacts array size
      if (artifactsRef.current.length < 20 && Math.random() > 0.95) {
        artifactsRef.current.push(new DigitalArtifact(canvas));
      }

      // Update and draw artifacts
      artifactsRef.current = artifactsRef.current.filter(artifact => {
        if (artifact.update()) {
          artifact.draw(ctx);
          return true;
        }
        return false;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Clear artifacts on cleanup
      artifactsRef.current = [];
    };
  }, [showEffect, generateNoiseTexture]);
  
  if (!isActive) return null;
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 100,
        opacity: showEffect ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        mixBlendMode: 'screen'
      }}
    />
  );
};
```

## File: src/components/TextStack/TextStack.tsx

- Extension: .tsx
- Language: typescript
- Size: 4631 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```typescript
import React, { useEffect, useState } from 'react';

export const DistortedStack = ({ isPlayingAudio }) => {
    const [offset, setOffset] = useState(0);
    const fontFamilies = [
      'neo-brutalist6',
      'neo-brutalist6',
      'neo-brutalist4',
      'neo-brutalist5',
      'neo-brutalist6',
      'neo-brutalist7',
      'neo-brutalist8',
      'neo-brutalist9'
    ];

    useEffect(() => {
      const interval = setInterval(() => {
        setOffset(prev => (prev + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    }, []);
  
    return (
      <>
        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.85; }
            }
          `}
        </style>
        <div className="absolute right-0 lg:right-20 top-0 h-full flex flex-col justify-center">
          <div className="space-y-6 transform-gpu">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                style={{
                  ...i === 3 
                    ? {
                        WebkitTextStroke: '0.02px white',
                        color: 'black',
                        filter: 'url(#irregular-outline)'
                      }
                    : {
                        filter: isPlayingAudio ? 'url(#playing-effect)' : 'url(#default-effect)',
                        animation: `pulse ${2 + i * 0.1}s ease-in-out infinite`,
                        transition: 'filter 0.3s ease'
                      }
                }}
                className={`
                  text-4xl md:text-5xl lg:text-6xl 
                  font-bold 
                  font-${fontFamilies[i]}
                  transform-gpu
                  transition-all duration-300
                  ${i === 3 ? '' : 'text-white'}
                  px-6 lg:px-0
                `}
              >
                {i === 3 ? 'SIGNAL23' : (
                  <div 
                    style={{ transform: 'scale(-1, 1)' }} 
                    className="inline-block"
                  >
                    SIGNAL23
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
  
        <svg className="hidden">
          <defs>
            {/* Default effect with mild erosion */}
            <filter id="default-effect">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="1.2"
                numOctaves="5"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="12"
              />
              <feGaussianBlur stdDeviation=".3"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncG type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncB type="linear" slope="1.8" intercept="-0.2"/>
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic"/>
            </filter>
  
            {/* More intense effect for when playing */}
            <filter id="playing-effect">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="2.5"
                numOctaves="6"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="25"
              />
              <feGaussianBlur stdDeviation="1.5"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="2" intercept="-0.2"/>
                <feFuncG type="linear" slope="2" intercept="-0.2"/>
                <feFuncB type="linear" slope="2" intercept="-0.2"/>
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic"/>
            </filter>

            {/* Outline effect */}
            <filter id="irregular-outline">
              <feTurbulence 
                type="turbulence" 
                baseFrequency="0.7"
                numOctaves="3"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="1"
              />
              <feGaussianBlur stdDeviation="0.03"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.2"/>
                <feFuncG type="linear" slope="1.2"/>
                <feFuncB type="linear" slope="1.2"/>
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>
      </>
    );
  };
```

## File: src/assets/images/DALLE_2024-10-04_14.18.22_-_A_minimalistic_dystopian_landscape_with_only_a_few_faded_abstract_shapes_resembling_abandoned_buildings._The_structures_appear_ghostly_and_barely_visi.jpeg

- Extension: .jpeg
- Language: unknown
- Size: 0 bytes
- Created: 2024-10-21 10:41:37
- Modified: 2024-10-21 10:41:37

### Code

```unknown

```

## File: src/assets/images/DALL·E 2024-10-10 12.13.05 - Create a more impressionist, minimalistic, and ruin-like logo for the electronic duo 'Signal-23.' The design should evoke the feeling of abandoned.jpg

- Extension: .jpg
- Language: unknown
- Size: 0 bytes
- Created: 2024-10-21 10:41:48
- Modified: 2024-10-21 10:41:37

### Code

```unknown

```


```

## File: babel.config.json

- Extension: .json
- Language: json
- Size: 204 bytes
- Created: 2024-10-24 21:56:22
- Modified: 2024-10-24 21:56:22

### Code

```json
{
    "presets": [
      "@babel/preset-env",
      ["@babel/preset-react", {
        "runtime": "classic"  // Use classic runtime instead of automatic
      }],
      "@babel/preset-typescript"
    ]
  }
```

## File: .babelrc

- Extension: 
- Language: unknown
- Size: 65 bytes
- Created: 2024-10-23 20:20:46
- Modified: 2024-10-23 20:20:46

### Code

```unknown
{
    "presets": ["@babel/preset-env", "@babel/preset-react"]
  }
```

## File: tailwind.config.js

- Extension: .js
- Language: javascript
- Size: 1609 bytes
- Created: 2025-01-09 19:52:02
- Modified: 2025-01-09 19:52:02

### Code

```javascript
module.exports = {
  purge: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
    './src/styles/**/*.css'
  ],
  darkMode: false,
  theme: {
    extend: {
      fontFamily: {
        'neo-brutalist': ['Neo Brutalist', 'sans-serif'],
        'neo-brute-transparent': ['Neobrutetest', 'sans-serif'],
        'neo-brutalist4': ['NeobruteTest4', 'sans-serif'],
        'neo-brutalist5': ['NeobruteTest5', 'sans-serif'],
        'neo-brutalist6': ['NeobruteTest6', 'sans-serif'],
        'neo-brutalist7': ['NeobruteTest7', 'sans-serif'],
        'neo-brutalist8': ['NeobruteTest8', 'sans-serif'],
        'neo-brutalist9': ['NeobruteTest9', 'sans-serif'],
        'ibm-mono': ['IBM Plex Mono', 'monospace'],
        'space-mono': ['Space Mono', 'monospace'],
      },
      animation: {
        'flash': 'flash 0.5s ease-in-out infinite',
        'tear': 'tear 0.2s ease-in-out infinite',
        'scanline': 'scanline 1s linear infinite',
        'flicker': 'flicker 0.2s ease-in-out infinite',
      },
      keyframes: {
        flash: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
        tear: {
          '0%, 100%': { transform: 'translateY(0) skewY(-3deg)' },
          '50%': { transform: 'translateY(5px) skewY(-2deg)' },
        },
        scanline: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  variants: {
    extend: {}
  },
  plugins: [],
}

```

## File: netlify.toml

- Extension: .toml
- Language: toml
- Size: 280 bytes
- Created: 2024-10-21 21:19:59
- Modified: 2024-10-21 21:19:59

### Code

```toml
[build]
  publish = "build"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "14"

[[headers]]
  for = "/*"
    [headers.values]
    Access-Control-Allow-Origin = "*"

[[headers]]
  for = "*.mp3"
    [headers.values]
    Cache-Control = "public, max-age=31536000"
```

## File: webpack.config.js

- Extension: .js
- Language: javascript
- Size: 1975 bytes
- Created: 2025-01-27 16:05:26
- Modified: 2025-01-27 16:05:26

### Code

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',  // Changed from index.js to index.tsx
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,  // Add TypeScript file handling
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
                '@babel/preset-typescript'  // Add TypeScript preset
              ]
            }
          }
        ]
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(mp3|wav)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]'
        }
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          to: '',
          globOptions: {
            ignore: ['**/index.html'],
          },
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.css'],  // Add TypeScript extensions
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    hot: true,
    port: 8080,
    host: '0.0.0.0',
    historyApiFallback: true,
  },
};
```

## File: README.md

- Extension: .md
- Language: markdown
- Size: 4184 bytes
- Created: 2024-10-22 09:16:35
- Modified: 2024-10-22 09:16:35

### Code

```markdown
# SIGNAL-23 Website

A React-based website for the electronic music duo Signal-23, featuring an interactive noise background with dynamic signal effects.

## Installation

1. Install Docker:
   - Windows/Mac: Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Linux: Follow your distribution's instructions for installing Docker Engine

2. Clone the repository:
```bash
git clone https://github.com/yourusername/signal-23-website.git
cd signal-23-website
```

3. Run with Docker:
```bash
docker compose up --build
```

4. Open your browser and go to: http://localhost:8080

## Project Structure

### Root Configuration Files
- `docker-compose.yml` - Docker Compose configuration for local development
- `Dockerfile` - Container configuration for building the development environment
- `netlify.toml` - Netlify deployment configuration
- `package.json` - Node.js project configuration and dependencies
- `postcss.config.js` - PostCSS configuration for CSS processing
- `tailwind.config.js` - Tailwind CSS customization and configuration
- `webpack.config.js` - Webpack build and development server configuration

### Source Code (`/src`)
- `index.js` - Application entry point
- `App.js` - Main React component with noise effect and navigation
- `App.lines.js` - Alternative version with line effects
- `App.static.js` - Static version of the main component

#### Components (`/src/components`)
- `AudioPlayer.js` - Audio playback component
- `MusicLinks.js` - Music platform links component
- `SocialLinks.js` - Social media links component

#### Styles (`/src/styles`)
- `main.css` - Primary stylesheet with Tailwind imports
- `fonts.css` - Custom font declarations
- `responsive.css` - Media queries and responsive styling

#### Assets (`/src/assets`)
- `/fonts` - Custom fonts including Neo Brutalist
- `/images` - Project images and artwork

### Public Files (`/public`)
- `index.html` - HTML entry point
- `abridged_tim0.mp3` - Audio content

## Key Technologies

- React
- Tailwind CSS
- Docker
- Webpack
- Netlify for deployment

## File Details

### Configuration Files
```javascript
// webpack.config.js
// Configures build process, including:
// - JavaScript/JSX processing
// - CSS/PostCSS processing
// - Asset handling (fonts, audio)
// - Development server setup

// tailwind.config.js
// Customizes Tailwind CSS, including:
// - Custom font configurations
// - Theme extensions
// - Responsive design utilities

// postcss.config.js
// Sets up PostCSS plugins:
// - Tailwind CSS
// - Autoprefixer for browser compatibility
```

### Core React Components
```javascript
// src/index.js
// Application entry point:
// - Renders main App component
// - Imports global styles

// src/App.js
// Main application component:
// - Implements noise background effect
// - Handles audio playback
// - Manages navigation and dropdowns
```

### Styling
```css
/* styles/main.css */
// Primary stylesheet:
// - Imports Tailwind directives
// - Imports custom fonts
// - Imports responsive styles

/* styles/responsive.css */
// Responsive design rules:
// - Tablet adaptations (768px+)
// - Desktop layouts (1024px+)
```

### Docker Configuration
```yaml
# docker-compose.yml
# Development environment setup:
# - Port mapping (8080)
# - Volume mounts for hot reloading
# - Environment variables

# Dockerfile
# Container configuration:
# - Node.js setup
# - Dependency installation
# - Development server startup
```

## Development

The project uses Docker for consistent development environments. The development server includes:
- Hot reloading
- Source maps
- Development build optimizations

To stop the development server:
```bash
docker compose down
```

## Deployment

The site is deployed on Netlify. The `netlify.toml` configuration handles:
- Build commands
- Environment setup
- Headers for audio file caching
- CORS configuration

## Troubleshooting

If you encounter issues:
1. Check Docker is running
2. Ensure ports are available (8080)
3. Check console for build errors
4. Clear Docker cache if needed:
   ```bash
   docker compose down
   docker compose build --no-cache
   ```

For other issues, please open a GitHub issue.
```

## File: .dockerignore

- Extension: 
- Language: unknown
- Size: 358 bytes
- Created: 2024-11-15 10:32:20
- Modified: 2024-11-15 10:32:20

### Code

```unknown
node_modules
npm-debug.log
build
# Version control
.git
.gitignore

# Dependencies
node_modules
ai_be/venv

# Environment variables
.env
.env.local
.env.*.local

# IDE files
.idea
.vscode
*.swp
*.swo

# Build outputs
dist
build
*.pyc
__pycache__
.pytest_cache

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# Docker
Dockerfile*
docker-compose*
```

## File: package.json

- Extension: .json
- Language: json
- Size: 1101 bytes
- Created: 2025-01-27 16:01:05
- Modified: 2025-01-27 16:01:05

### Code

```json
{
  "name": "signal-23-website",
  "version": "1.0.0",
  "scripts": {
    "start": "webpack serve --mode development --host 0.0.0.0 --port 8080",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "lucide-react": "^0.263.1",
    "three": "^0.157.0",
    "ts-loader": "^9.4.2",
    "simplex-noise": "^4.0.1",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@babel/core": "^7.15.0",
    "@babel/preset-env": "^7.15.0",
    "@babel/preset-react": "^7.14.5",
    "@babel/preset-typescript": "^7.15.0", 
    "@types/react": "^17.0.0",           
    "@types/react-dom": "^17.0.0",
    "@types/three": "^0.157.0",
    "typescript": "^4.5.0",
    "autoprefixer": "^10.3.1",
    "babel-loader": "^8.2.2",
    "css-loader": "^6.2.0",
    "html-webpack-plugin": "^5.3.2",
    "postcss": "^8.3.6",
    "postcss-loader": "^6.1.1",
    "style-loader": "^3.2.1",
    "tailwindcss": "^2.2.7",
    "webpack": "^5.50.0",
    "webpack-cli": "^4.8.0",
    "webpack-dev-server": "^4.0.0",
    "copy-webpack-plugin": "^11.0.0"
  }
}
```

## File: tsconfig.json

- Extension: .json
- Language: json
- Size: 795 bytes
- Created: 2024-10-24 21:56:22
- Modified: 2024-10-24 21:56:22

### Code

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "jsx": "react",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    },
    "noImplicitAny": false,
    "outDir": "./dist",  // Add output directory
    "sourceMap": true    // Enable source maps
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.js",
    "src/**/*.jsx"
  ],
  "exclude": ["node_modules"]
}
```

## File: docker-compose.yml

- Extension: .yml
- Language: yaml
- Size: 238 bytes
- Created: 2024-11-15 10:32:20
- Modified: 2024-11-15 10:32:20

### Code

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "8080:8080"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true
```

## File: postcss.config.js

- Extension: .js
- Language: javascript
- Size: 104 bytes
- Created: 2024-10-21 11:32:00
- Modified: 2024-10-21 11:32:00

### Code

```javascript
module.exports = {
    plugins: [
      require('tailwindcss'),
      require('autoprefixer'),
    ]
  }
```

## File: Dockerfile.frontend

- Extension: .frontend
- Language: unknown
- Size: 772 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```unknown
FROM node:14

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Copy TypeScript config
COPY tsconfig.json ./

# Clean npm cache and remove existing node_modules (if any)
RUN npm cache clean --force && \
    rm -rf node_modules

# Install dependencies including TypeScript and Babel presets
RUN npm install --save-dev typescript @types/react @types/react-dom @types/three @babel/preset-typescript

# Install all other dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Ensure the public directory exists
RUN mkdir -p public

# Copy the audio file to the public directory
COPY public/abridged_tim0.mp3 public/

# Expose the port your app runs on
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
```

## File: public/index.html

- Extension: .html
- Language: html
- Size: 299 bytes
- Created: 2024-11-15 10:32:20
- Modified: 2024-11-15 10:32:20

### Code

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="/favicon logo 32x32.png" />
    <title>Signal-23</title>
</head>
<body>
    <div id="root"></div>
</body>
</html>
```

## File: src/index.tsx

- Extension: .tsx
- Language: typescript
- Size: 224 bytes
- Created: 2024-10-24 21:56:22
- Modified: 2024-10-24 21:56:22

### Code

```typescript
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/main.css';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
```

## File: src/App.tsx

- Extension: .tsx
- Language: typescript
- Size: 4074 bytes
- Created: 2025-01-27 16:49:50
- Modified: 2025-01-27 16:49:50

### Code

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Terminal } from './components/Terminal/Terminal';
import { Portal } from './components/Portal/Portal';
import { AudioPlayer } from './components/Audio/AudioPlayer';
import { NavigationLink } from './components/Navigation/NavigationLink';
import { DistortedStack } from './components/TextStack/TextStack';
import { EnhancedNumberStation } from './components/EnhancedNumberStation/EnhancedNumberStation';
import { GlitchOverlay } from './components/GlitchOverlay/GlitchOverlay';

// Home component (previously App content)
const Home = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showGlitch, setShowGlitch] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { 
      label: "music@signal23.net",
      description: "Get in touch" 
    }
  ];

  // Handle portal click to navigate to terminal
  const handlePortalClick = () => {
    navigate('/terminal');
  };

  return (
    <>
      <div className="relative w-full h-screen overflow-hidden bg-black">
        <div className="fixed inset-0 bg-black -z-10" />
        
        <div className="relative h-full">
          <div className="absolute inset-0 z-20">
            <AudioPlayer 
              isPlaying={isPlayingAudio}
              onPlayPause={() => setIsPlayingAudio(!isPlayingAudio)}
              audioSource="/pieces-website-mp3.mp3"
            />
          </div>

          {/* Make Portal clickable */}
          <Portal 
            isMobile={isMobile} 
            onClick={handlePortalClick}
          />

          <EnhancedNumberStation 
            isMobile={isMobile}
            onGlitchChange={setShowGlitch}
          />

          <div className="hidden md:grid grid-cols-12 h-full relative z-10">
            <div className="col-span-7 xl:col-span-8 relative">
            </div>

            <div className="col-span-5 xl:col-span-4 relative">
              <div className="h-full">
                <DistortedStack isPlayingAudio={isPlayingAudio} />
              </div>
            </div>
          </div>

          <div className="md:hidden flex flex-col items-center h-full relative z-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-white font-neo-brute-transparent mt-12">
              SIGNAL-3
            </h1>
          </div>

          <nav className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <div className="flex justify-center space-x-8 opacity-60 font-ibm-mono">
              {navLinks.map((link, index) => (
                <NavigationLink key={index} {...link} />
              ))}
            </div>
          </nav>
        </div>

        <svg className="hidden">
          <defs>
            <filter id="eroded-blur">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="1.2"
                numOctaves="5"
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="12"
              />
              <feGaussianBlur stdDeviation=".3"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncG type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncB type="linear" slope="1.8" intercept="-0.2"/>
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic"/>
            </filter>
          </defs>
        </svg>
      </div>

      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
        <GlitchOverlay isActive={showGlitch} />
      </div>
    </>
  );
};

// Main App component with routing
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/terminal" element={<Terminal />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
```

## File: DEPRECATED/static_app.tsx

- Extension: .tsx
- Language: typescript
- Size: 7855 bytes
- Created: 2024-11-15 10:32:20
- Modified: 2024-11-15 10:32:20

### Code

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Music2, Mail, Info, ExternalLink } from 'lucide-react';

const App = () => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);

  const navLinks = [
    { 
      icon: <Info className="w-5 h-5" />,
      label: "INFO",
      href: "#",
      description: "About Signal-23" 
    },
    { 
      icon: <Mail className="w-5 h-5" />,
      label: "CONTACT",
      href: "mailto:your@email.com",
      description: "Get in touch" 
    },
    { 
      icon: <Music2 className="w-5 h-5" />,
      label: "MUSIC",
      href: "#",
      description: "Listen on platforms",
      platforms: [
        { name: "Spotify", url: "#" },
        { name: "Apple Music", url: "#" },
        { name: "Bandcamp", url: "#" },
        { name: "SoundCloud", url: "#" }
      ]
    }
  ];

  // Canvas and noise effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;     // red
        data[i + 1] = value; // green
        data[i + 2] = value; // blue
        data[i + 3] = 255;   // alpha
      }

      return imageData;
    };

    const drawSignal = (imageData) => {
      const data = imageData.data;
      const signalPhrase = "SIGNAL-23";
      const signalStart = Math.random() * (data.length / 4 - signalPhrase.length * 8);

      for (let i = 0; i < signalPhrase.length; i++) {
        const charCode = signalPhrase.charCodeAt(i);
        for (let j = 0; j < 8; j++) {
          const bit = (charCode >> j) & 1;
          const index = (signalStart + i * 8 + j) * 4;
          if (bit && index < data.length - 4) {
            data[index] = 255;     // red
            data[index + 1] = 0;   // green
            data[index + 2] = 0;   // blue
          }
        }
      }
    };

    const drawWave = (imageData, type) => {
      const data = imageData.data;
      const width = canvas.width;
      const startY = Math.random() * canvas.height;
      const amplitude = Math.random() * 30 + 10;
      const frequency = Math.random() * 0.02 + 0.01;
      const thickness = Math.floor(Math.random() * 3) + 1;

      for (let x = 0; x < width; x++) {
        let y;

        switch(type) {
          case 'sine':
            y = startY + Math.sin(x * frequency + time) * amplitude;
            break;
          case 'triangle':
            y = startY + (Math.abs(((x * frequency + time) % (2 * Math.PI)) - Math.PI) - Math.PI/2) * amplitude/2;
            break;
          case 'saw':
            y = startY + ((x * frequency + time) % Math.PI) * amplitude/Math.PI;
            break;
          default:
            y = startY + Math.sin(x * frequency + time) * amplitude;
        }

        for (let t = -thickness; t <= thickness; t++) {
          const yPos = Math.floor(y + t);
          if (yPos >= 0 && yPos < canvas.height) {
            const index = (yPos * width + x) * 4;
            if (index < data.length - 4) {
              data[index] = 255;     // white waves
              data[index + 1] = 255;
              data[index + 2] = 255;
            }
          }
        }
      }
    };

    const animate = () => {
      const imageData = generateNoise();

      if (Math.random() < 0.1) {
        drawSignal(imageData);
      }

      if (Math.random() < 0.2) {
        const waveTypes = ['sine', 'triangle', 'saw'];
        const randomType = waveTypes[Math.floor(Math.random() * waveTypes.length)];
        drawWave(imageData, randomType);
      }

      ctx.putImageData(imageData, 0, 0);
      time += 0.05;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Audio control
  useEffect(() => {
    if (isPlayingAudio) {
      audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlayingAudio]);

  // Dropdown menu control
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (index) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setHoveredLink(index);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredLink(null);
    }, 300); // Increased delay for better usability
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Navigation Links */}
      <nav className="absolute top-0 right-0 p-6 z-20">
        <div className="flex flex-col space-y-4">
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
                  className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white/10 backdrop-blur-sm"
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

      {/* Main Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <h1 className="text-6xl font-bold mb-8 text-white font-neo-brutalist">SIGNAL-23</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => setIsPlayingAudio(!isPlayingAudio)} 
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            {isPlayingAudio ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
          </button>
        </div>
      </div>

      <audio ref={audioRef} loop>
        <source src="/pieces-website-mp3.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default App;
```

## File: src/styles/main.css

- Extension: .css
- Language: unknown
- Size: 254 bytes
- Created: 2025-01-27 16:16:57
- Modified: 2025-01-27 16:16:57

### Code

```unknown
@import 'fonts.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
@import 'responsive.css';


/* Reset default margins and padding */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#root {
  height: 100vh;
  width: 100vw;
}
```

## File: src/styles/responsive.css

- Extension: .css
- Language: unknown
- Size: 317 bytes
- Created: 2024-10-21 10:38:37
- Modified: 2024-10-21 10:38:37

### Code

```unknown
/* responsive.css */
@media (min-width: 768px) {
    /* Tablet styles */
    body {
        padding: 40px;
    }
}

@media (min-width: 1024px) {
    /* Desktop styles */
    main {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
    }

    section {
        width: 48%;
    }
}
```

## File: src/styles/fonts.css

- Extension: .css
- Language: unknown
- Size: 1435 bytes
- Created: 2025-01-09 19:56:01
- Modified: 2025-01-09 19:56:01

### Code

```unknown
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap');

@font-face {
  font-family: 'Neo Brutalist';
  src: url('../assets/fonts/Neo Brutalist.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'NeobruteTest4';
  src: url('../assets/fonts/NeobruteTest4.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'NeobruteTest5';
  src: url('../assets/fonts/NeobruteTest5.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}


@font-face {
  font-family: 'NeobruteTest6';
  src: url('../assets/fonts/NeobruteTest6.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'NeobruteTest7';
  src: url('../assets/fonts/NeobruteTest7.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'NeobruteTest8';
  src: url('../assets/fonts/NeobruteTest8.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'Neobrutetest';
  src: url('../assets/fonts/NeoBruteTest.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
}
```

## File: src/components/Portal/PortalShader.ts

- Extension: .ts
- Language: typescript
- Size: 4182 bytes
- Created: 2024-11-14 15:13:03
- Modified: 2024-11-14 15:13:03

### Code

```typescript
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
```

## File: src/components/Portal/Portal.tsx

- Extension: .tsx
- Language: typescript
- Size: 5939 bytes
- Created: 2025-01-27 16:54:16
- Modified: 2025-01-27 16:54:16

### Code

```typescript
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { noiseShader, vertexShader, fragmentShader } from './PortalShader';

interface PortalProps {
  isMobile: boolean;
  onClick?: () => void;
}

export const Portal: React.FC<PortalProps> = ({ isMobile, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);

  const handleClick = (e: React.MouseEvent) => {
    console.log('Portal clicked');
    if (onClick) {
      onClick();
    }
  };

  // Initialize Three.js scene
  const initThree = useCallback(() => {
    if (!canvasRef.current) return;

    // Clean up existing instances
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 7;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    rendererRef.current = renderer;

    const geometry = new THREE.PlaneGeometry(16, 9, 128, 128);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        mouse: { value: new THREE.Vector2(0.5, 0.5) },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        isMobile: { value: isMobile }
      },
      transparent: true,
      side: THREE.DoubleSide
    });
    materialRef.current = material;

    const portal = new THREE.Mesh(geometry, material);
    scene.add(portal);

    return () => {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      
      while(scene.children.length > 0) { 
        const object = scene.children[0];
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
        scene.remove(object);
      }
    };
  }, [isMobile]);

  // Rest of your existing handlers...
  const handleResize = useCallback(() => {
    if (!rendererRef.current || !cameraRef.current || !materialRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    
    rendererRef.current.setSize(width, height);
    
    materialRef.current.uniforms.resolution.value.set(width, height);
    materialRef.current.uniforms.isMobile.value = width <= 768;
  }, []);

  const animate = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !materialRef.current) return;

    timeRef.current += 0.01;
    materialRef.current.uniforms.time.value = timeRef.current;
    materialRef.current.uniforms.mouse.value.set(mouseRef.current.x, mouseRef.current.y);

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    mouseRef.current.x = (event.clientX / window.innerWidth);
    mouseRef.current.y = 1 - (event.clientY / window.innerHeight);
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (event.touches.length > 0) {
      mouseRef.current.x = (event.touches[0].clientX / window.innerWidth);
      mouseRef.current.y = 1 - (event.touches[0].clientY / window.innerHeight);
    }
  }, []);

  useEffect(() => {
    const cleanup = initThree();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('resize', handleResize);

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      cleanup?.();
    };
  }, [initThree, handleMouseMove, handleTouchMove, handleResize, animate]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      {/* Clickable overlay positioned in the center of the screen */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-[400px] h-[500px] cursor-pointer relative"
          onClick={handleClick}
        >
          <div 
            className="absolute inset-0 rounded-lg transition-all duration-300
                       hover:bg-white/5 border border-white/10"
            style={{ 
              boxShadow: '0 0 20px rgba(255,255,255,0.1)',
            }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                          text-white/30 text-sm font-mono">
              Click to Enter
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## File: src/components/Navigation/NavigationLink.tsx

- Extension: .tsx
- Language: typescript
- Size: 1946 bytes
- Created: 2025-01-09 19:11:44
- Modified: 2025-01-09 19:11:44

### Code

```typescript
import React, { useState, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

interface Platform {
  name: string;
  url: string;
}

interface NavigationLinkProps {
  icon?: React.ReactNode;
  label: string;
  href: string;
  description?: string;
  platforms?: Platform[];
}

export const NavigationLink: React.FC<NavigationLinkProps> = ({
  icon,
  label,
  href,
  description,
  platforms
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href={href}
        className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </a>
      
      {platforms && isHovered && (
        <div 
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 rounded-md shadow-lg bg-white/10 backdrop-blur-sm"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="py-1">
            {platforms.map((platform, index) => (
              <a
                key={index}
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
  );
};
```

## File: src/components/Terminal/Terminal.tsx

- Extension: .tsx
- Language: typescript
- Size: 3917 bytes
- Created: 2025-01-27 16:16:29
- Modified: 2025-01-27 16:16:29

### Code

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export const Terminal: React.FC = () => {
  const navigate = useNavigate();
  
  const handleExit = () => {
    navigate('/');
  };
  const [input, setInput] = useState('');
  const [output, setOutput] = useState([
    { type: 'system', content: 'SIGNAL-23 Terminal [Version 1.0.0]' },
    { type: 'system', content: '(c) 2025 SIGNAL-23. All rights reserved.' },
    { type: 'system', content: 'Type "help" for available commands.' },
    { type: 'prompt', content: '>' }
  ]);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  const commands = {
    exit: () => {
      handleExit();
      return ['Exiting terminal...'];
    },
    help: () => [
      'Available commands:',
      'clear    - Clear the terminal',
      'echo     - Echo a message',
      'date     - Display current date',
      'help     - Show this help message',
      'exit     - Return to main page',
      'whoami   - Display current user',
      'signal   - Display SIGNAL-23 information'
    ],
    clear: () => [],
    date: () => [new Date().toLocaleString()],
    whoami: () => ['SIGNAL-23_USER'],
    signal: () => [
      'SIGNAL-23',
      '----------',
      'Electronic music duo',
      'Established: 2024',
      'Status: Active',
      'Location: [REDACTED]'
    ],
    echo: (args) => [args.join(' ')]
  };

  const handleCommand = (cmd) => {
    const parts = cmd.trim().split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    if (command === '') {
      return [''];
    }
    
    if (command === 'clear') {
      setOutput([]);
      return [];
    }
    
    if (commands[command]) {
      return commands[command](args);
    }
    
    return [`Command not found: ${command}`];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newOutput = [
      ...output,
      { type: 'command', content: input }
    ];
    
    const result = handleCommand(input);
    result.forEach(line => {
      newOutput.push({ type: 'output', content: line });
    });
    
    newOutput.push({ type: 'prompt', content: '>' });
    
    setOutput(newOutput);
    setInput('');
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [output]);

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-black p-4 font-mono text-green-500 overflow-hidden"
      onClick={handleFocus}
      style={{ margin: 0 }}
    >
      <div 
        ref={terminalRef}
        className="h-full overflow-y-auto"
      >
        {output.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {line.type === 'prompt' ? (
              <div className="flex">
                <span>{line.content}</span>
                {i === output.length - 1 && (
                  <form onSubmit={handleSubmit} className="flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="w-full bg-transparent outline-none ml-1 text-green-500"
                      autoFocus
                    />
                  </form>
                )}
              </div>
            ) : (
              <div className={`${
                line.type === 'system' ? 'text-green-600' : 
                line.type === 'command' ? 'pl-1' : ''
              }`}>
                {line.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Terminal;
```

## File: src/components/Audio/AudioPlayer.tsx

- Extension: .tsx
- Language: typescript
- Size: 1296 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```typescript
import React, { useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  audioSource: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  isPlaying, 
  onPlayPause, 
  audioSource 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(e => console.error("Audio playback failed:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying]);

  return (
    <>
      <button 
        onClick={onPlayPause} 
        className="w-96 h-96 rounded-full opacity-0 hover:opacity-5 transition-opacity cursor-pointer absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {/* Optional: Very faint icon that appears on hover */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {isPlaying ? 
            <Pause className="w-16 h-16 text-white" /> : 
            <Play className="w-16 h-16 text-white" />
          }
        </div>
      </button>
      <audio ref={audioRef} loop>
        <source src={audioSource} type="audio/mpeg" />
      </audio>
    </>
  );
};
```

## File: src/components/EnhancedNumberStation/EnhancedNumberStation.tsx

- Extension: .tsx
- Language: typescript
- Size: 5077 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```typescript
import React, { useState, useCallback, useEffect } from 'react';

interface NumberStationProps {
    isMobile: boolean;
    onGlitchChange: (isGlitching: boolean) => void;  // Added this prop
}

export const EnhancedNumberStation: React.FC<NumberStationProps> = ({ 
    isMobile, 
    onGlitchChange 
}) => {
    const BASE_OPACITY = 0.7;
    const HIDDEN_OPACITY = 0;
    
    const [sequence, setSequence] = useState([]);
    const [warning, setWarning] = useState('');
    const [glitchEffect, setGlitchEffect] = useState(false);
    
    const warnings = [
      "THIS PLACE IS A MESSAGE AND PART OF A SYSTEM OF MESSAGES",
      "WHAT IS HERE IS DANGEROUS AND REPULSIVE TO US",
      "THE DANGER IS STILL PRESENT IN YOUR TIME AS IT WAS IN OURS",
      "DO NOT DISTURB",
      "SIGNAL DETECTED",
      "TRANSMISSION ACTIVE",
      "DATA CORRUPTION DETECTED"
    ];
  
    // ... other functions remain the same ...
    const generateSequence = () => {
      const specialChars = ['0', '1', '█', '▓', '▒', '░'];
      return Array.from({ length: 8 }, () => ({
        value: specialChars[Math.floor(Math.random() * specialChars.length)],
        opacity: BASE_OPACITY,
        isGlitched: Math.random() > 0.8
      }));
    };
  
    const createGlitchEffect = useCallback((index) => {
      setSequence(prev => 
        prev.map((num, i) => 
          i === index ? {
            ...num,
            value: ['█', '▓', '▒', '░'][Math.floor(Math.random() * 4)],
            opacity: Math.random() * BASE_OPACITY + 0.3
          } : num
        )
      );
    }, []);
  
    const generatePattern = useCallback(async () => {
      const patternLength = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < patternLength; i++) {
        const indices = Array.from(
          { length: Math.floor(Math.random() * 3) + 1 },
          () => Math.floor(Math.random() * sequence.length)
        );
        await flashNumbers(indices, 200);
      }
    }, [sequence.length]);
  
    const flashNumbers = async (indices, duration) => {
      const shouldGlitch = Math.random() > 0.7;
      if (shouldGlitch) setGlitchEffect(true);
      
      indices.forEach(index => {
        setSequence(prev => 
          prev.map((num, i) => 
            i === index ? { ...num, opacity: BASE_OPACITY } : num
          )
        );
        if (shouldGlitch) createGlitchEffect(index);
      });
      
      await new Promise(r => setTimeout(r, duration));
      
      indices.forEach(index => {
        setSequence(prev => 
          prev.map((num, i) => 
            i === index ? { ...num, opacity: HIDDEN_OPACITY } : num
          )
        );
      });
      
      setGlitchEffect(false);
      await new Promise(r => setTimeout(r, duration * 0.5));
    };

    // Single warning interval effect
    useEffect(() => {
      const warningInterval = setInterval(() => {
        if (Math.random() > 0.4) {
          const newWarning = warnings[Math.floor(Math.random() * warnings.length)];
          console.log('Showing warning:', newWarning);
          setWarning(newWarning);
          onGlitchChange(true);  // Notify parent

          setTimeout(() => {
            setWarning('');
            onGlitchChange(false);  // Notify parent
          }, 2000);
        }
      }, 7000);
      
      return () => clearInterval(warningInterval);
    }, [onGlitchChange]);
  
    useEffect(() => {
      const runSequence = async () => {
        setSequence(generateSequence());
        await generatePattern();
        setTimeout(runSequence, Math.random() * 1000 + 2000);
      };
      
      runSequence();
    }, [generatePattern]);
  
    return (
      <div className="fixed top-0 left-0 w-full h-16 px-6 font-mono pointer-events-none">
        <div className={`h-full ${isMobile ? 'flex justify-between items-center' : 'flex flex-col justify-center'}`}>
          <div 
            className={`flex space-x-2 ${glitchEffect ? 'animate-pulse' : ''}`}
            style={{ 
              textShadow: glitchEffect ? '2px 2px 8px rgba(255,255,255,0.5)' : 'none',
              transform: glitchEffect ? 'translateX(-1px)' : 'none',
              transition: 'transform 0.1s'
            }}
          >
            {sequence.map((num, index) => (
              <span
                key={index}
                className="transition-all duration-100"
                style={{
                  opacity: num.opacity,
                  color: 'white',
                  transform: num.isGlitched ? 'translateY(1px)' : 'none',
                  textShadow: num.isGlitched ? '1px 1px 4px rgba(255,255,255,0.3)' : 'none'
                }}
              >
                {num.value}
              </span>
            ))}
          </div>
          {warning && (
            <div 
              className={`
                text-xs text-red-500 opacity-70 tracking-wider animate-fadeInOut
                ${isMobile ? 'ml-4 max-w-[160px]' : 'mt-2'}
              `}
            >
              {warning}
            </div>
          )}
        </div>
      </div>
    );
};
```

## File: src/components/GlitchOverlay/GlitchOverlay.tsx

- Extension: .tsx
- Language: typescript
- Size: 5675 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```typescript
import React, { useEffect, useRef, useState, useCallback } from 'react';

interface GlitchOverlayProps {
  isActive: boolean;
  delay?: number;
}

export const GlitchOverlay: React.FC<GlitchOverlayProps> = ({ 
  isActive, 
  delay = 1000 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showEffect, setShowEffect] = useState(false);
  const artifactsRef = useRef<DigitalArtifact[]>([]);
  const noiseTextureRef = useRef<ImageData | null>(null);
  const frameRef = useRef(0);
  const animationRef = useRef<number>();
  
  // Pre-generate text options
  const GLITCH_TEXTS = [
    'SIGNAL DETECTED',
    'DATA CORRUPTION',
    'WARNING',
    'TRANSMISSION ACTIVE',
    'DO NOT DISTURB',
    'THIS PLACE IS A MESSAGE',
    'THE DANGER IS STILL PRESENT',
    '01010101',
    'SIGNAL-3'
  ];

  // Memoized noise texture generation
  const generateNoiseTexture = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const intensity = Math.random();
      const value = intensity > 0.5 ? 255 * (intensity * 0.8) : 0;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = Math.random() * 35;
    }
    
    return imageData;
  }, []);

  class DigitalArtifact {
    x: number;
    y: number;
    width: number;
    height: number;
    lifetime: number;
    maxLifetime: number;
    type: 'line' | 'text' | 'interference';
    intensity: number;
    text?: string;

    constructor(canvas: HTMLCanvasElement) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.width = Math.random() * 200 + 50;
      this.height = Math.random() * 2 + 1;
      this.lifetime = 0;
      this.maxLifetime = Math.random() * 60 + 30;
      this.type = Math.random() > 0.6 ? 'line' : Math.random() > 0.5 ? 'text' : 'interference';
      this.intensity = Math.random() * 0.7 + 0.3;
      
      if (this.type === 'text') {
        this.text = GLITCH_TEXTS[Math.floor(Math.random() * GLITCH_TEXTS.length)];
      }
    }

    draw(ctx: CanvasRenderingContext2D) {
      const alpha = 1 - (this.lifetime / this.maxLifetime);
      ctx.globalAlpha = alpha * this.intensity;

      switch (this.type) {
        case 'line':
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(this.x, this.y, this.width, this.height);
          break;
        case 'text':
          ctx.font = '12px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(this.text || '', this.x, this.y);
          break;
        case 'interference':
          const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + 100);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(this.x, this.y, 2, 100);
          break;
      }

      ctx.globalAlpha = 1;
    }

    update() {
      this.lifetime++;
      return this.lifetime < this.maxLifetime;
    }
  }

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setShowEffect(true);
      }, delay);
      
      return () => {
        clearTimeout(timer);
        setShowEffect(false);
      };
    } else {
      setShowEffect(false);
    }
  }, [isActive, delay]);

  useEffect(() => {
    if (!showEffect || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Regenerate noise texture on resize
      noiseTextureRef.current = generateNoiseTexture(ctx, canvas.width, canvas.height);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      frameRef.current++;
      
      // Update noise texture every other frame
      if (frameRef.current % 2 === 0) {
        noiseTextureRef.current = generateNoiseTexture(ctx, canvas.width, canvas.height);
      }
      
      if (noiseTextureRef.current) {
        ctx.putImageData(noiseTextureRef.current, 0, 0);
      }

      // Scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let i = 0; i < canvas.height; i += 2) {
        ctx.fillRect(0, i, canvas.width, 1);
      }

      // Limit artifacts array size
      if (artifactsRef.current.length < 20 && Math.random() > 0.95) {
        artifactsRef.current.push(new DigitalArtifact(canvas));
      }

      // Update and draw artifacts
      artifactsRef.current = artifactsRef.current.filter(artifact => {
        if (artifact.update()) {
          artifact.draw(ctx);
          return true;
        }
        return false;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Clear artifacts on cleanup
      artifactsRef.current = [];
    };
  }, [showEffect, generateNoiseTexture]);
  
  if (!isActive) return null;
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 100,
        opacity: showEffect ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        mixBlendMode: 'screen'
      }}
    />
  );
};
```

## File: src/components/TextStack/TextStack.tsx

- Extension: .tsx
- Language: typescript
- Size: 4631 bytes
- Created: 2024-11-16 13:59:14
- Modified: 2024-11-16 13:59:14

### Code

```typescript
import React, { useEffect, useState } from 'react';

export const DistortedStack = ({ isPlayingAudio }) => {
    const [offset, setOffset] = useState(0);
    const fontFamilies = [
      'neo-brutalist6',
      'neo-brutalist6',
      'neo-brutalist4',
      'neo-brutalist5',
      'neo-brutalist6',
      'neo-brutalist7',
      'neo-brutalist8',
      'neo-brutalist9'
    ];

    useEffect(() => {
      const interval = setInterval(() => {
        setOffset(prev => (prev + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    }, []);
  
    return (
      <>
        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.85; }
            }
          `}
        </style>
        <div className="absolute right-0 lg:right-20 top-0 h-full flex flex-col justify-center">
          <div className="space-y-6 transform-gpu">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                style={{
                  ...i === 3 
                    ? {
                        WebkitTextStroke: '0.02px white',
                        color: 'black',
                        filter: 'url(#irregular-outline)'
                      }
                    : {
                        filter: isPlayingAudio ? 'url(#playing-effect)' : 'url(#default-effect)',
                        animation: `pulse ${2 + i * 0.1}s ease-in-out infinite`,
                        transition: 'filter 0.3s ease'
                      }
                }}
                className={`
                  text-4xl md:text-5xl lg:text-6xl 
                  font-bold 
                  font-${fontFamilies[i]}
                  transform-gpu
                  transition-all duration-300
                  ${i === 3 ? '' : 'text-white'}
                  px-6 lg:px-0
                `}
              >
                {i === 3 ? 'SIGNAL23' : (
                  <div 
                    style={{ transform: 'scale(-1, 1)' }} 
                    className="inline-block"
                  >
                    SIGNAL23
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
  
        <svg className="hidden">
          <defs>
            {/* Default effect with mild erosion */}
            <filter id="default-effect">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="1.2"
                numOctaves="5"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="12"
              />
              <feGaussianBlur stdDeviation=".3"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncG type="linear" slope="1.8" intercept="-0.2"/>
                <feFuncB type="linear" slope="1.8" intercept="-0.2"/>
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic"/>
            </filter>
  
            {/* More intense effect for when playing */}
            <filter id="playing-effect">
              <feTurbulence 
                type="fractalNoise" 
                baseFrequency="2.5"
                numOctaves="6"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="25"
              />
              <feGaussianBlur stdDeviation="1.5"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="2" intercept="-0.2"/>
                <feFuncG type="linear" slope="2" intercept="-0.2"/>
                <feFuncB type="linear" slope="2" intercept="-0.2"/>
              </feComponentTransfer>
              <feComposite operator="in" in2="SourceGraphic"/>
            </filter>

            {/* Outline effect */}
            <filter id="irregular-outline">
              <feTurbulence 
                type="turbulence" 
                baseFrequency="0.7"
                numOctaves="3"
                seed={offset}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="1"
              />
              <feGaussianBlur stdDeviation="0.03"/>
              <feComponentTransfer>
                <feFuncR type="linear" slope="1.2"/>
                <feFuncG type="linear" slope="1.2"/>
                <feFuncB type="linear" slope="1.2"/>
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>
      </>
    );
  };
```

## File: src/assets/images/DALLE_2024-10-04_14.18.22_-_A_minimalistic_dystopian_landscape_with_only_a_few_faded_abstract_shapes_resembling_abandoned_buildings._The_structures_appear_ghostly_and_barely_visi.jpeg

- Extension: .jpeg
- Language: unknown
- Size: 0 bytes
- Created: 2024-10-21 10:41:37
- Modified: 2024-10-21 10:41:37

### Code

```unknown

```

## File: src/assets/images/DALL·E 2024-10-10 12.13.05 - Create a more impressionist, minimalistic, and ruin-like logo for the electronic duo 'Signal-23.' The design should evoke the feeling of abandoned.jpg

- Extension: .jpg
- Language: unknown
- Size: 0 bytes
- Created: 2024-10-21 10:41:48
- Modified: 2024-10-21 10:41:37

### Code

```unknown

```

