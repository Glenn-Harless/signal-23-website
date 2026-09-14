/**
 * Static /legal/* page generation for webpack.
 *
 * The privacy policy must be readable without JavaScript and by URL checkers
 * (Meta's app review fetches the Privacy Policy URL). Each legal page is a
 * plain HTML document: metadata, the shared stylesheet inlined, and the policy
 * markup from src/components/Legal/*.content.html. No scripts are injected.
 * Netlify serves the file before applying the /* -> /index.html rewrite.
 * CommonJS on purpose: webpack.config.js requires it.
 */
const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap';
const DEFAULT_SITE_URL = 'https://signal23.net';

const LEGAL_PAGES = [
  {
    route: '/legal/privacy',
    content: 'src/components/Legal/privacy-policy.content.html',
    title: 'Privacy Policy · Signal-23',
    description:
      'How Signal-23 handles information on signal23.net, for instrument-rack purchases, and in its own Facebook and Instagram advertising.',
  },
];

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
  const raw = process.env.LISTEN_SITE_URL || process.env.URL || DEFAULT_SITE_URL;
  return String(raw).replace(/\/+$/, '');
}

function readRepoFile(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');
}

function legalRoutes() {
  return LEGAL_PAGES.map((page) => page.route);
}

/**
 * @param {{ template: string, css: string }} options paths relative to the repo root
 */
function legalHtmlPlugins({ template, css }) {
  const stylesheet = readRepoFile(css);
  return LEGAL_PAGES.map((page) => {
    const content = readRepoFile(page.content);
    if (!/<h1[\s>]/.test(content)) {
      throw new Error(`${page.content}: legal page content must contain an <h1>`);
    }
    return new HtmlWebpackPlugin({
      template,
      filename: `${page.route.replace(/^\//, '')}/index.html`,
      chunks: [],
      inject: false,
      templateParameters: {
        page: {
          title: escapeHtml(page.title),
          description: escapeHtml(page.description),
          url: escapeHtml(`${siteUrl()}${page.route}`),
          fontHref: escapeHtml(FONT_HREF),
          css: stylesheet,
          content,
        },
      },
    });
  });
}

/** webpack-dev-server rewrites so /legal/<page> serves the generated file locally. */
function legalDevRewrites() {
  return LEGAL_PAGES.map((page) => ({
    from: new RegExp(`^${page.route.replace(/\//g, '\\/')}\\/?$`),
    to: `${page.route}/index.html`,
  }));
}

module.exports = { LEGAL_PAGES, legalHtmlPlugins, legalDevRewrites, legalRoutes };
