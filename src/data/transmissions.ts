import { validateVisualExport } from '../lib/validateVisualExport';

export type TransmissionType =
  | 'visual'
  | 'interactive'
  | 'release'
  | 'artifact'
  | 'page'
  | 'commerce';

export type TransmissionStatus =
  | 'active'
  | 'wip'
  | 'archived'
  | 'broken';

export type TransmissionVisibility =
  | 'public'
  | 'soft-secret'
  | 'operator-only'
  | 'deprecated';

export type ExportTarget =
  | 'canvas'
  | 'reel'
  | 'hardware-feed'
  | 'still'
  | 'loop';

export type ExportAspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export type VisualExportCapability = {
  supportedTargets: ExportTarget[];
  defaultTarget: ExportTarget;
  seed: {
    supported: boolean;
    defaultMode: 'random' | 'fixed';
  };
  duration: {
    supported: boolean;
    defaultSeconds?: number;
    minSeconds?: number;
    maxSeconds?: number;
  };
  aspectRatios: {
    supported: ExportAspectRatio[];
    default: ExportAspectRatio;
  };
  capture: 'browser-source' | 'external-only';
  hardwareFeedSafe: boolean;
  operatorNotes?: string;
};

export type Transmission = {
  slug: string;
  route: string;
  title: string;
  type: TransmissionType;
  status: TransmissionStatus;
  visibility: TransmissionVisibility;
  release?: string;
  tags: string[];
  exportUse: ExportTarget[];
  visualExport?: VisualExportCapability;
  notes?: string;
  addedAt: string;
};

export const decayVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 8, minSeconds: 3, maxSeconds: 30 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic. Allow 2-3s warmup before capture for breathing rhythm to establish.',
};

export const reclamationVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 12, minSeconds: 6, maxSeconds: 60 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: false,
  operatorNotes: 'Non-deterministic bloom cycle. Export mode hides the HUD and dev recording button; allow enough lead time for growth phase selection.',
};

export const broadcastVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 8, minSeconds: 3, maxSeconds: 30 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: false,
  operatorNotes: 'Non-deterministic relay tower. Ring bursts and audio remain click-triggered, so hardware-feed is not promised in v1.',
};

export const forestVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 12, minSeconds: 3, maxSeconds: 60 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic forest drift. Useful unattended after load with fireflies and tree traces active.',
};

export const resonanceVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 12, minSeconds: 3, maxSeconds: 60 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic resonance field. Export mode hides the click-toggled logs for clean capture.',
};

export const growthVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 12, minSeconds: 3, maxSeconds: 60 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic branching system. Export mode hides the click-toggled logs for clean capture.',
};

export const forbiddingVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 8, minSeconds: 3, maxSeconds: 30 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic monolith field. Works unattended with slow camera drift.',
};

export const wellVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 12, minSeconds: 3, maxSeconds: 60 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic recursive descent. Works unattended with continuous fall motion.',
};

export const tangleVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 8, minSeconds: 3, maxSeconds: 30 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic signal topology. Export mode disables the click-toggled quantum log overlay.',
};

export const learningVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 8, minSeconds: 3, maxSeconds: 30 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic learning landscape. Export mode hides the policy matrix overlay for clean source capture.',
};

export const stepwellVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 12, minSeconds: 3, maxSeconds: 60 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic recursive descent. Export mode hides the coordinate and log UI.',
};

export const nerveVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 8, minSeconds: 3, maxSeconds: 30 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic nerve network. Useful unattended with autonomous pulse propagation.',
};

export const faceVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 8, minSeconds: 3, maxSeconds: 30 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic model route. Allow model load before capture.',
};

export const handVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 8, minSeconds: 3, maxSeconds: 30 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic model route. Allow skeleton-hand load before capture.',
};

export const birthVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 8, minSeconds: 3, maxSeconds: 30 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic model route. Allow skeleton-hand load before capture.',
};

export const murmurVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 26, minSeconds: 3, maxSeconds: 60 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic flocking cycle. Full logo convergence cycle is about 26 seconds.',
};

export const streamfrontVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 12, minSeconds: 4, maxSeconds: 60 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic delta. Flows unattended after load; allow a few seconds for motes to populate the distributaries.',
};

export const myceliumVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 12, minSeconds: 4, maxSeconds: 60 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic slime-mold transport network. Filaments condense within ~15s of load and rewire continuously as sources exhaust; runs unattended.',
};

export const rivuletVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 12, minSeconds: 4, maxSeconds: 60 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic minimal node-edge stream; a pulse flows the graph. Settles after load.',
};

export const mountainVisualExport: VisualExportCapability = {
  supportedTargets: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
  defaultTarget: 'canvas',
  seed: { supported: false, defaultMode: 'random' },
  duration: { supported: true, defaultSeconds: 12, minSeconds: 4, maxSeconds: 60 },
  aspectRatios: {
    supported: ['9:16', '16:9', '1:1', '4:5'],
    default: '9:16',
  },
  capture: 'browser-source',
  hardwareFeedSafe: true,
  operatorNotes: 'Non-deterministic contour-lattice peak on a build/hold/erode cycle; rotates continuously. A new massif is surveyed each cycle.',
};

export const transmissions: Transmission[] = [
  {
    slug: 'home',
    route: '/',
    title: 'PUBLIC PORTAL',
    type: 'page',
    status: 'active',
    visibility: 'public',
    tags: ['home', 'portal', 'audio'],
    exportUse: [],
    notes: 'Primary public entry point. Keep sparse, direct, and free of operator navigation.',
    addedAt: '2026-05-07',
  },
  {
    slug: 'terminal',
    route: '/terminal',
    title: 'B.A.N.I.S TERMINAL',
    type: 'interactive',
    status: 'active',
    visibility: 'public',
    tags: ['terminal', 'commands', 'archive'],
    exportUse: [],
    notes: 'Public command surface. Operator routes remain undisclosed unless intentionally leaked later.',
    addedAt: '2026-05-07',
  },
  {
    slug: 'instruments',
    route: '/instruments',
    title: 'INSTRUMENT RACKS',
    type: 'commerce',
    status: 'active',
    visibility: 'public',
    tags: ['racks', 'commerce', 'downloads'],
    exportUse: [],
    notes: 'Public rack acquisition route backed by payment rails.',
    addedAt: '2026-05-07',
  },
  {
    slug: 'instruments-success',
    route: '/instruments/success',
    title: 'INSTRUMENT DELIVERY',
    type: 'commerce',
    status: 'active',
    visibility: 'public',
    tags: ['racks', 'payment', 'delivery'],
    exportUse: [],
    notes: 'Post-checkout delivery route for instrument rack downloads.',
    addedAt: '2026-05-07',
  },
  {
    slug: 'terms',
    route: '/terms',
    title: 'TERMS',
    type: 'page',
    status: 'active',
    visibility: 'public',
    tags: ['terms', 'commerce', 'policy'],
    exportUse: [],
    addedAt: '2026-05-07',
  },
  {
    slug: 'testblandingpage',
    route: '/testblandingpage',
    title: 'LEGACY RESONANCE REDIRECT',
    type: 'page',
    status: 'archived',
    visibility: 'deprecated',
    tags: ['legacy', 'redirect', 'resonance'],
    exportUse: [],
    notes: 'Compatibility route that redirects to /resonance.',
    addedAt: '2026-05-07',
  },
  {
    slug: 'decay',
    route: '/decay',
    title: 'DECAY SIGNAL',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    release: 'Decay',
    tags: ['entropy', 'shell', 'strain', 'geometry', 'release-decay'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: decayVisualExport,
    notes: 'Good source for slow breathing motion and degraded geometric tension.',
    addedAt: '2026-05-07',
  },
  {
    slug: 'reclamation',
    route: '/reclamation',
    title: 'RECLAMATION BLOOM',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['reclamation', 'bloom', 'ash', 'growth'],
    exportUse: ['canvas', 'reel', 'still', 'loop'],
    visualExport: reclamationVisualExport,
    notes: 'Blooming visual system for recovery, ash, and softened mechanical growth.',
    addedAt: '2026-05-07',
  },
  {
    slug: 'broadcast',
    route: '/broadcast',
    title: 'BROADCAST RELAY',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['broadcast', 'numbers-station', 'tower', 'signal'],
    exportUse: ['canvas', 'reel', 'still', 'loop'],
    visualExport: broadcastVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'forest',
    route: '/forest',
    title: 'FOREST ARRAY',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['forest', 'growth', 'fireflies', 'instanced'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: forestVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'resonance',
    route: '/resonance',
    title: 'RESONANCE FIELD',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['resonance', 'field', 'signal'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: resonanceVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'growth',
    route: '/growth',
    title: 'GROWTH SYSTEM',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['growth', 'organic', 'signal'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: growthVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'forbidding',
    route: '/forbidding',
    title: 'FORBIDDING BLOCKS',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['forbidding', 'blocks', 'bass', 'architecture'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: forbiddingVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'well',
    route: '/well',
    title: 'WELL',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['well', 'depth', 'submerged'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: wellVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'tangle',
    route: '/tangle',
    title: 'TANGLE',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['tangle', 'network', 'constraint'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: tangleVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'learning',
    route: '/learning',
    title: 'LEARNING',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['learning', 'system', 'behavior'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: learningVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'stepwell',
    route: '/stepwell',
    title: 'STEPWELL',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['stepwell', 'pluck', 'architecture'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: stepwellVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'nerve',
    route: '/nerve',
    title: 'NERVE',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['nerve', 'edge', 'impulse'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: nerveVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'face',
    route: '/face',
    title: 'FACE',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['face', 'model', 'figure'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: faceVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'hand',
    route: '/hand',
    title: 'HAND',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['hand', 'model', 'gesture'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: handVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'birth',
    route: '/birth',
    title: 'BIRTH',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['birth', 'model', 'emergence'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: birthVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'murmur',
    route: '/murmur',
    title: 'MURMUR',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['murmur', 'signal', 'texture'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: murmurVisualExport,
    addedAt: '2026-05-07',
  },
  {
    slug: 'streamfront',
    route: '/streamfront',
    title: 'STREAMFRONT DELTA',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['stream', 'delta', 'branching', 'flow', 'water'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: streamfrontVisualExport,
    addedAt: '2026-06-05',
  },
  {
    slug: 'rivulet',
    route: '/rivulet',
    title: 'RIVULET',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['stream', 'graph', 'nodes', 'minimal', 'flow'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: rivuletVisualExport,
    addedAt: '2026-06-06',
  },
  {
    slug: 'mycelium',
    route: '/mycelium',
    title: 'MYCELIUM',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['mycelium', 'network', 'nodes', 'slime-mold', 'emergence'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: myceliumVisualExport,
    addedAt: '2026-07-05',
  },
  {
    slug: 'mountain',
    route: '/mountain',
    title: 'MOUNTAIN',
    type: 'visual',
    status: 'active',
    visibility: 'soft-secret',
    tags: ['mountain', 'contour', 'lattice', 'nodes', 'crystalline'],
    exportUse: ['canvas', 'reel', 'hardware-feed', 'still', 'loop'],
    visualExport: mountainVisualExport,
    addedAt: '2026-07-05',
  },
];

for (const transmission of transmissions) {
  if (!transmission.visualExport) {
    continue;
  }

  const validationErrors = validateVisualExport(transmission.visualExport);
  if (validationErrors.length > 0) {
    console.error(
      `[visual-export] ${transmission.route} invalid visualExport metadata: ${validationErrors.join('; ')}`,
    );
  }
}

export const getTransmissionBySlug = (slug: string) =>
  transmissions.find((transmission) => transmission.slug === slug);
