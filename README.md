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

## Pages

| Path | Description |
|------|-------------|
| `/` | Home |
| `/terminal` | Terminal |
| `/instruments` | Instruments |
| `/instruments/success` | Instruments Success |
| `/resonance` | Resonance |
| `/growth` | Growth |
| `/forbidding` | Forbidding Blocks |
| `/well` | Well |
| `/tangle` | Tangle |
| `/learning` | Learning |
| `/terms` | Terms |
| `/stepwell` | Stepwell |
| `/broadcast` | Broadcast |
| `/forest` | Forest |
| `/nerve` | Nerve |
| `/face` | Face |

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