/**
 * Static /listen/<slug>/index.html generation for webpack.
 *
 * For every track in src/data/listenTracks.json this emits an HtmlWebpackPlugin
 * instance that renders src/components/Listen/template.html with:
 *   - track-specific <title>, Open Graph and Twitter metadata
 *   - the shared Listen.css inlined
 *   - the landing page markup pre-rendered (works with JavaScript disabled)
 *   - only the `listen` entry's chunks, not the full site bundle
 *
 * Netlify serves an existing file before applying the /* -> /index.html rewrite,
 * so ads land on this file directly. The markup here mirrors ListenPage.tsx.
 * CommonJS on purpose: webpack.config.js requires it.
 */
const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = require('../src/data/listenTracks.json');
const spotifyIcon = require('../src/components/Listen/spotify-icon.json');

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap';
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

function siteUrl() {
  const raw = process.env.LISTEN_SITE_URL || process.env.URL || config.siteUrl;
  return String(raw).replace(/\/+$/, '');
}

function validateTrack(track) {
  const problems = [];
  if (!SLUG_PATTERN.test(track.slug || '')) problems.push(`slug "${track.slug}" must be lowercase letters, digits and hyphens`);
  if (!track.title) problems.push('title is required');
  if (!/^https:\/\/open\.spotify\.com\/track\/[A-Za-z0-9]+$/.test(track.spotifyUrl || '')) {
    problems.push(`spotifyUrl "${track.spotifyUrl}" must be a canonical https://open.spotify.com/track/<id> URL`);
  }
  if (!track.artwork || !track.artwork.src) problems.push('artwork.src is required');
  if (track.description && /[.!?]\s+\S/.test(track.description)) problems.push('description must be at most one sentence');
  if (problems.length) throw new Error(`listenTracks.json: track "${track.slug}": ${problems.join('; ')}`);
}

function pageTitle(track) {
  return `${track.title} · ${config.artist}`;
}

function pageDescription(track) {
  return track.description || `Listen to ${track.title} by ${config.artist} on Spotify.`;
}

/** Mirrors the JSX in ListenPage.tsx (minus the JS-only loop video). */
function renderListenMarkup(track) {
  const artist = escapeHtml(config.artist);
  const alt = escapeHtml(track.artwork.alt || `${track.title} artwork`);
  const description = track.description
    ? `\n      <p class="listen__description">${escapeHtml(track.description)}</p>`
    : '';

  return `<main class="listen">
  <div class="listen__frame">
    <header class="listen__head">
      <p class="listen__artist">${artist}</p>
      <h1 class="listen__title">${escapeHtml(track.title)}</h1>${description}
    </header>
    <figure class="listen__art">
      <img src="${escapeHtml(track.artwork.src)}" width="${track.artwork.width}" height="${track.artwork.height}" alt="${alt}" decoding="async" fetchpriority="high">
    </figure>
    <div class="listen__actions">
      <a class="listen__cta" href="${escapeHtml(track.spotifyUrl)}" data-track-slug="${escapeHtml(track.slug)}">
        <svg viewBox="${spotifyIcon.viewBox}" aria-hidden="true" focusable="false"><path d="${spotifyIcon.path}"></path></svg>
        <span>Listen on Spotify</span>
      </a>
      <nav class="listen__secondary" aria-label="More from ${artist}">
        <a class="listen__explore" href="${escapeHtml(track.exploreHref || '/')}">Explore ${artist}</a>
        <a class="listen__privacy" href="/legal/privacy">Privacy</a>
      </nav>
    </div>
  </div>
</main>`;
}

function listenPageParameters(track, css) {
  const origin = siteUrl();
  const share = track.shareImage || track.artwork;
  return {
    slug: escapeHtml(track.slug),
    artist: escapeHtml(config.artist),
    title: escapeHtml(pageTitle(track)),
    description: escapeHtml(pageDescription(track)),
    url: escapeHtml(`${origin}/listen/${track.slug}`),
    image: escapeHtml(`${origin}${share.src}`),
    imageWidth: share.width,
    imageHeight: share.height,
    imageAlt: escapeHtml(track.artwork.alt || `${track.title} artwork`),
    fontHref: escapeHtml(FONT_HREF),
    css,
    markup: renderListenMarkup(track),
  };
}

function listenTrackSlugs() {
  return config.tracks.map((track) => track.slug);
}

/**
 * @param {{ template: string, css: string, entry?: string }} options paths relative to the repo root
 */
function listenHtmlPlugins({ template, css, entry = 'listen' }) {
  const stylesheet = fs.readFileSync(path.resolve(__dirname, '..', css), 'utf8');
  return config.tracks.map((track) => {
    validateTrack(track);
    return new HtmlWebpackPlugin({
      template,
      filename: `listen/${track.slug}/index.html`,
      chunks: [entry],
      inject: 'body',
      scriptLoading: 'defer',
      templateParameters: { page: listenPageParameters(track, stylesheet) },
    });
  });
}

/** webpack-dev-server rewrites so /listen/<slug> serves the generated file locally. */
function listenDevRewrites() {
  const slugs = listenTrackSlugs();
  if (!slugs.length) return [];
  return [
    {
      from: new RegExp(`^/listen/(${slugs.join('|')})/?$`),
      to: ({ match }) => `/listen/${match[1]}/index.html`,
    },
  ];
}

module.exports = {
  listenHtmlPlugins,
  listenDevRewrites,
  listenTrackSlugs,
  renderListenMarkup,
  listenPageParameters,
  validateTrack,
};
