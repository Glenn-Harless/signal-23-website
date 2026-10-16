export type SiteNavItem = {
  label: string;
  to: string;
  // Paths that mark this item active. '/' matches exactly; others also match their sub-paths.
  match: string[];
};

export const SITE_NAV_ITEMS: SiteNavItem[] = [
  { label: 'HOME', to: '/', match: ['/'] },
  { label: 'A/V', to: '/av', match: ['/av'] },
  { label: 'DL', to: '/instruments', match: ['/instruments'] },
  { label: 'BUY', to: '/buy', match: ['/buy'] },
];

// Public surfaces that carry the nav. Soft-secret visuals, operator surfaces,
// listen ad pages and legal pages stay nav-free.
const SITE_NAV_ROUTES = ['/', '/terminal', '/instruments', '/av', '/buy', '/terms'];

const matchesPath = (path: string, base: string) =>
  base === '/' ? path === '/' : path === base || path.startsWith(`${base}/`);

export const showsSiteNav = (path: string) =>
  SITE_NAV_ROUTES.some((route) => matchesPath(path, route));

export const isSiteNavItemActive = (item: SiteNavItem, path: string) =>
  item.match.some((base) => matchesPath(path, base));
