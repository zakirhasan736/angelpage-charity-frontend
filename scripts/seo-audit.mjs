#!/usr/bin/env node
/**
 * Technical SEO audit for Angelpage.
 *
 *   node scripts/seo-audit.mjs [baseUrl] [--max=300] [--out=seo-report.md]
 *
 * Crawls /sitemap.xml (every child sitemap) plus robots.txt, llms.txt and a
 * few known URLs, then checks each page:
 *   status + redirects, <title> 30–60 chars, meta description 70–160,
 *   canonical (absolute, https, no query unless paginated), robots meta,
 *   Open Graph + Twitter tags (raster og:image), exactly one <h1>,
 *   JSON-LD parses and has required fields per type, images without alt,
 *   and internal links that return 4xx/5xx (broken links).
 * Exits 1 when any error is found, so it can run in CI.
 */
import { writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const BASE = (args.find(a => !a.startsWith('--')) || 'http://localhost:3000').replace(/\/$/, '');
const MAX = Number((args.find(a => a.startsWith('--max=')) || '--max=300').split('=')[1]);
const OUT = (args.find(a => a.startsWith('--out=')) || '--out=seo-report.md').split('=')[1];
const SITE_ORIGIN_HINT = /https?:\/\/(www\.)?angelpage\.shop/;

const REQUIRED = {
  Product: ['name', 'image', 'offers'],
  Offer: ['price', 'priceCurrency', 'availability'],
  BlogPosting: ['headline', 'image', 'datePublished', 'author'],
  Article: ['headline', 'image', 'datePublished', 'author'],
  Event: ['name', 'startDate', 'location', 'eventAttendanceMode', 'organizer'],
  BreadcrumbList: ['itemListElement'],
  Organization: ['name'],
  SiteOrganization: ['name', 'url', 'logo'],
  FAQPage: ['mainEntity'],
  WebPage: ['name', 'url'],
};

const issues = [];
const add = (level, url, msg) => issues.push({ level, url, msg });
const toLocal = u => u.replace(SITE_ORIGIN_HINT, BASE);

async function get(url, { redirect = 'manual' } = {}) {
  try {
    const res = await fetch(url, { redirect, headers: { 'User-Agent': 'AngelpageSEOAudit/1.0 (+Googlebot-compatible)' } });
    const text = res.headers.get('content-type')?.includes('text') || res.headers.get('content-type')?.includes('xml') ? await res.text() : '';
    return { status: res.status, headers: res.headers, text };
  } catch (e) {
    return { status: 0, headers: new Headers(), text: '', error: String(e) };
  }
}

const attr = (tag, name) => (tag.match(new RegExp(`${name}=["']([^"']*)["']`, 'i')) || [])[1];
const meta = (html, key) => {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const t = tags.find(m => new RegExp(`(name|property)=["']${key}["']`, 'i').test(m));
  return t ? attr(t, 'content') : undefined;
};
const decode = s => (s || '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function sitemapUrls() {
  const idx = await get(`${BASE}/sitemap.xml`);
  if (idx.status !== 200) {
    add('error', '/sitemap.xml', `status ${idx.status}`);
    return [];
  }
  const children = [...idx.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => toLocal(m[1]));
  const urls = [];
  for (const child of children) {
    const r = await get(child);
    if (r.status !== 200) {
      add('error', child, `child sitemap status ${r.status}`);
      continue;
    }
    const locs = [...r.text.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    if (!locs.length) add('warn', child, 'child sitemap has no URLs');
    for (const l of locs) {
      if (l.includes('?') && !/[?&]page=\d+$/.test(l)) add('error', child, `sitemap lists a query URL: ${l}`);
      urls.push(toLocal(l));
    }
  }
  return [...new Set(urls)];
}

function checkJsonLd(url, html) {
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  if (!blocks.length) add('warn', url, 'no JSON-LD');
  const types = [];
  for (const raw of blocks) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      add('error', url, 'JSON-LD does not parse');
      continue;
    }
    const nodes = Array.isArray(data) ? data : data['@graph'] || [data];
    const walk = node => {
      if (!node || typeof node !== 'object') return;
      const t = [].concat(node['@type'] || []);
      for (const ty of t) {
        types.push(ty);
        const key = ty === 'Organization' && String(node['@id'] || '').endsWith('#organization') && node.logo !== undefined ? 'SiteOrganization' : ty;
        for (const f of REQUIRED[key] || []) if (node[f] === undefined || node[f] === '' || (Array.isArray(node[f]) && !node[f].length)) add('error', url, `${ty} missing "${f}"`);
        if (ty === 'Offer' && node.price !== undefined && Number.isNaN(Number(node.price))) add('error', url, 'Offer price is not a number');
      }
      for (const v of Object.values(node)) if (typeof v === 'object') Array.isArray(v) ? v.forEach(walk) : walk(v);
      for (const key of ['image', 'logo', 'url']) {
        const v = node[key];
        const s = typeof v === 'string' ? v : v?.url;
        if (s && typeof s === 'string' && s.startsWith('/')) add('error', url, `${t[0] || 'node'}.${key} is relative: ${s}`);
      }
    };
    nodes.forEach(walk);
  }
  return types;
}

async function auditPage(url, linkSet) {
  const r = await get(url);
  const path = url.replace(BASE, '') || '/';
  if (r.status >= 300 && r.status < 400) {
    add(r.status === 301 || r.status === 308 ? 'info' : 'warn', path, `redirect ${r.status} → ${r.headers.get('location')} (sitemaps should list final URLs)`);
    return null;
  }
  if (r.status !== 200) {
    add('error', path, `status ${r.status}`);
    return null;
  }
  const html = r.text;
  const title = decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1]);
  const desc = decode(meta(html, 'description'));
  const robots = meta(html, 'robots') || '';
  const canonTag = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i) || [])[0];
  const canonical = canonTag ? attr(canonTag, 'href') : undefined;
  const ogImage = meta(html, 'og:image');
  const h1s = (html.match(/<h1\b/gi) || []).length;
  const noindex = /noindex/i.test(robots) || /noindex/i.test(r.headers.get('x-robots-tag') || '');

  if (!title) add('error', path, 'missing <title>');
  else if (title.length > 65) add('warn', path, `title ${title.length} chars (aim ≤ 60): "${title}"`);
  else if (title.length < 25) add('warn', path, `title ${title.length} chars (aim 30–60): "${title}"`);
  if (!desc) add('error', path, 'missing meta description');
  else if (desc.length > 165 || desc.length < 60) add('warn', path, `description ${desc.length} chars (aim 70–160)`);
  if (!canonical) add('error', path, 'missing canonical');
  else {
    if (!/^https:\/\//.test(canonical)) add('error', path, `canonical not absolute https: ${canonical}`);
    if (canonical.includes('?') && !/[?&]page=\d+$/.test(canonical)) add('warn', path, `canonical has a query: ${canonical}`);
    const cPath = canonical.replace(/^https?:\/\/[^/]+/, '') || '/';
    if (!noindex && cPath !== path && !path.startsWith('/charity/find-a-charity/')) add('warn', path, `canonical points elsewhere: ${cPath}`);
  }
  if (sitemapSet.has(url) && noindex) add('error', path, 'in sitemap but noindex');
  for (const k of ['og:title', 'og:description', 'og:url', 'og:type', 'twitter:card']) if (!meta(html, k)) add('warn', path, `missing ${k}`);
  if (!ogImage) add('error', path, 'missing og:image');
  else if (/\.svg(\?|$)/i.test(ogImage)) add('error', path, `og:image is SVG (not shown by social apps): ${ogImage}`);
  else if (!/^https?:\/\//.test(ogImage)) add('error', path, `og:image not absolute: ${ogImage}`);
  if (h1s !== 1) add(h1s === 0 ? 'error' : 'warn', path, `${h1s} <h1> tags`);
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const noAlt = imgs.filter(t => !/\balt=/i.test(t)).length;
  if (noAlt) add('warn', path, `${noAlt} <img> without alt`);
  const types = checkJsonLd(path, html);
  for (const m of html.matchAll(/<a\b[^>]*href=["'](\/[^"'#]*)["']/gi)) {
    const href = decode(m[1]);
    if (!href.startsWith('/_next') && !href.startsWith('/api/')) linkSet.add(href.split('#')[0]);
  }
  return { path, title, desc, canonical, robots: robots || 'index,follow', types: [...new Set(types)].join(', '), h1s };
}

const sitemapSet = new Set();

async function main() {
  console.log(`Auditing ${BASE}`);
  for (const f of ['/robots.txt', '/llms.txt', '/llms-full.txt', '/llm.txt', '/ai.txt', '/humans.txt', '/site.webmanifest', '/favicon.ico', '/.well-known/security.txt']) {
    const r = await get(`${BASE}${f}`);
    if (r.status !== 200) add('error', f, `status ${r.status}`);
  }
  const robots = await get(`${BASE}/robots.txt`);
  if (!/Sitemap:/i.test(robots.text)) add('error', '/robots.txt', 'no Sitemap line');
  if (/Disallow:\s*\/\s*$/m.test(robots.text.split('User-Agent: *')[1]?.split('User-Agent')[0] || '')) add('warn', '/robots.txt', 'everything disallowed (NEXT_PUBLIC_ALLOW_INDEXING=false?)');

  const urls = await sitemapUrls();
  urls.forEach(u => sitemapSet.add(u));
  const extra = ['/product?sort=price', '/product?category=women', '/does-not-exist-404', '/product/does-not-exist-404'].map(p => BASE + p);
  const pages = [...urls.slice(0, MAX)];
  const rows = [];
  const links = new Set();
  for (const u of pages) {
    const row = await auditPage(u, links);
    if (row) rows.push(row);
  }
  // behaviour checks
  const facet = await get(extra[0]);
  if (!/noindex/i.test(meta(facet.text, 'robots') || '')) add('error', '/product?sort=price', 'faceted URL is indexable (should be noindex)');
  const legacy = await get(extra[1]);
  if (![301, 308].includes(legacy.status)) add('error', '/product?category=women', `legacy category URL returns ${legacy.status} (expected 308 to /shop/women)`);
  for (const u of extra.slice(2)) {
    const r = await get(u);
    if (r.status !== 404) add('error', u.replace(BASE, ''), `missing page returns ${r.status} (soft 404, expected 404)`);
  }
  // broken internal links
  let checked = 0;
  for (const href of links) {
    if (checked++ > 400) break;
    const r = await get(BASE + href, { redirect: 'follow' });
    if (r.status >= 400 || r.status === 0) add('error', href, `broken internal link (status ${r.status})`);
  }

  const count = l => issues.filter(i => i.level === l).length;
  const report = [
    `# SEO audit: ${BASE}`,
    '',
    `Pages audited: ${rows.length} of ${urls.length} sitemap URLs · internal links checked: ${Math.min(links.size, 401)}`,
    `Errors: ${count('error')} · Warnings: ${count('warn')} · Info: ${count('info')}`,
    '',
    '## Issues',
    issues.length ? '| Level | URL | Issue |\n|---|---|---|\n' + issues.map(i => `| ${i.level} | ${i.url} | ${i.msg.replace(/\|/g, '\\|')} |`).join('\n') : 'None.',
    '',
    '## Pages',
    '| Path | Title | Desc | Robots | Schema |',
    '|---|---|---|---|---|',
    ...rows.map(r => `| ${r.path} | ${(r.title || '').replace(/\|/g, '/')} (${(r.title || '').length}) | ${(r.desc || '').length} | ${r.robots} | ${r.types} |`),
    '',
  ].join('\n');
  writeFileSync(OUT, report);
  console.log(`Errors ${count('error')}, warnings ${count('warn')} → ${OUT}`);
  process.exit(count('error') ? 1 : 0);
}

main();
