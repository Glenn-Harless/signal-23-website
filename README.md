# SIGNAL-23 Website

The Signal-23 website is a TypeScript/React experience for the electronic music duo Signal-23. It combines the public portal, audio-reactive and generative visual transmissions, an instrument-rack storefront, and hidden operator/index surfaces in a single client-rendered application.

## Stack

- React 17 and React Router 6
- TypeScript compiled through Babel
- Webpack 5 and webpack-dev-server
- Three.js, GSAP, Tone.js, and HLS.js for visual and audio systems
- Tailwind CSS plus route-specific CSS
- Netlify for the production build, SPA routing, and serverless functions
- Stripe Checkout and Cloudflare R2 for paid/free rack delivery
- Docker Compose for the repository's standard local frontend environment

The repository currently pins Node.js 18 in both Netlify and `Dockerfile.frontend`. Dependency/runtime upgrades should be handled as a separate, tested change rather than mixed into visual or documentation work.

## Local Development

### Docker Compose

```bash
docker compose up --build
```

Open [http://localhost:9823](http://localhost:9823). The container runs webpack-dev-server on port 8080 and Docker maps it to host port 9823.

Stop the environment with:

```bash
docker compose down
```

### Native Node.js

Use Node.js 18 to match the deployed environment:

```bash
npm ci
npm start
```

Open [http://localhost:8080](http://localhost:8080).

`npm start` serves the frontend only. To exercise Netlify Functions locally, copy `.env.example` to `.env`, supply the Stripe and Cloudflare R2 credentials, and run the project through Netlify Dev. The Netlify proxy is configured on port 8888 with webpack on target port 8080.

Do not commit `.env` or credentials.

## Build

```bash
npm run build
```

Webpack writes the production bundle to `build/`. Netlify runs the same command and publishes that directory. The SPA fallback in `netlify.toml` rewrites unmatched paths to `index.html`, allowing React Router to resolve direct route visits.

## Routes

Public and commerce routes:

| Path | Purpose |
| --- | --- |
| `/` | Public Signal-23 portal and audio entry point |
| `/terminal` | Public B.A.N.I.S. terminal |
| `/instruments` | Instrument-rack catalog and pay-what-you-want acquisition flow |
| `/instruments/success` | Stripe payment verification and signed-download delivery |
| `/terms` | Terms page |
| `/testblandingpage` | Deprecated compatibility path that redirects to `/resonance` |

Soft-secret visual transmissions:

| Path | Registry title |
| --- | --- |
| `/decay` | Decay Signal |
| `/reclamation` | Reclamation Bloom |
| `/broadcast` | Broadcast Relay |
| `/forest` | Forest Array |
| `/resonance` | Resonance Field |
| `/growth` | Growth System |
| `/forbidding` | Forbidding Blocks |
| `/well` | Well |
| `/tangle` | Tangle |
| `/learning` | Learning |
| `/stepwell` | Stepwell |
| `/nerve` | Nerve |
| `/face` | Face |
| `/hand` | Hand |
| `/birth` | Birth |
| `/murmur` | Murmur |
| `/streamfront` | Streamfront Delta |
| `/rivulet` | Rivulet |
| `/mycelium` | Mycelium |
| `/mountain` | Mountain |
| `/cloudform` | Cloudform |
| `/torchrite` | Torchrite |

Hidden internal surfaces:

| Path | Purpose |
| --- | --- |
| `/deaddrop` | Newest-first visual index with a featured latest intercept and searchable archive |
| `/operator` | Searchable/filterable registry console |
| `/operator/transmissions/:slug` | Registry detail and visual-export launch links |

The hidden surfaces are intentionally absent from public navigation. `robots.txt`, client-side metadata, and Netlify headers discourage indexing, but these controls are not authentication.

## Visual Export

Each of the 22 visual routes can act as a browser-rendered capture source. A route behaves normally without query parameters and enters export framing when `target` is present, for example:

```text
/torchrite?target=canvas&duration=8&aspect=9:16
```

Supported targets are `canvas`, `reel`, `hardware-feed`, `still`, and `loop`; individual route capabilities are defined in `src/data/transmissions.ts` and displayed in the operator console.

## Payment and Download Flow

- An exact `$0` selection calls `/.netlify/functions/free-download` and returns a 30-minute Cloudflare R2 signed URL without involving Stripe.
- An amount of `$0.50` or more calls `/.netlify/functions/create-checkout` and redirects to hosted Stripe Checkout.
- Stripe returns successful payments to `/instruments/success?session_id=...`; that page calls `/.netlify/functions/verify-payment` before receiving a 30-minute R2 signed URL.
- `/.netlify/functions/stripe-webhook` verifies Stripe signatures and logs completed or expired checkout sessions.

The current rack IDs are `arps`, `audio-fx`, `bass`, and `keys`. Their R2 object mapping lives in `netlify/functions/utils/storage.ts`.

## Repository Layout

```text
src/
  App.tsx                         React Router configuration
  components/                    Route and shared UI components
  data/transmissions.ts          Operator and visual-export registry
  hooks/                         Shared React hooks
  lib/                           Export parsing and validation
  styles/                        Global and shared styles
netlify/functions/               Stripe and R2 serverless endpoints
public/                          Static files, models, audio, and thumbnails
feature-dev-docs/                Living requirements, decisions, and tests
Dockerfile.frontend              Node 18 development image
docker-compose.yml               Host port 9823 → container port 8080
webpack.config.js                Development and production bundling
netlify.toml                     Build, functions, headers, and SPA fallback
```

## Configuration

The serverless payment flow expects:

| Variable | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Creates and verifies Stripe Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures |
| `R2_ENDPOINT` | Cloudflare R2 S3-compatible account endpoint |
| `R2_ACCESS_KEY_ID` | R2 API credential |
| `R2_SECRET_ACCESS_KEY` | R2 API credential |
| `R2_BUCKET` | Private rack bucket; defaults to `signal23-racks` |

See `.env.example` for placeholders.

## Verification

There is no automated test runner configured. For changes, at minimum:

```bash
npx tsc --noEmit
npm run build
```

Then smoke-test the affected routes at desktop and mobile widths. Payment changes also require Netlify Dev or a deploy preview because webpack-dev-server does not execute Netlify Functions.
