# Angelpage homepage audit · 25 November 2026

**Page 1 of the audit is open.** Production returned 200 for the homepage but 400 for 12 referenced JavaScript files and three stylesheets. Chromium reproduced all 15 failures. The main heading was absent from both the initial HTML and the live browser after eight seconds. A second request with a fresh query string reproduced the missing heading and a stylesheet error. About and subsequent pages await the live homepage retest.

This run used anonymous HTTPS requests and Chromium. The checked-out frontend was 58ebdf2 and the backend was 53f8ffd. The frontend contains 41 page route files, including private screens and templates that can represent many public URLs. Only the homepage received a page audit. Requests to linked destinations were link checks.

| Requested measure | Result |
| --- | --- |
| Pages audited / live pages cleared | 1 / 0 |
| Homepage, linked destinations, assets and discovery endpoints sampled | 65 distinct starting URLs, 50 final HTTP 200 and 15 HTTP 400 |
| Site Health and sitewide issue, error, warning and notice totals | Pending. The full crawl and the scoring tool's thresholds are needed for comparable totals. |

## Homepage observations

| Checks | Live evidence and disposition |
| --- | --- |
| 5xx, 4xx, page open, pages not crawled, DNS resolution | Homepage reachable from the audit client. No 5xx in the 65 responses. All 15 final 4xx were Next static assets. Origin DNS records were not independently inspected. |
| Broken internal JavaScript or CSS, external JavaScript or CSS, resource 403 | 12 internal scripts and three internal stylesheets returned an HTML error document. Example: /_next/static/chunks/05uy0s1pktkm2.css. The referenced Google gtag script returned 200. No external 403 in the sample. |
| Internal and external links, malformed links, internal and external images, ALT | The initial document contained 31 anchors and eight images. Linked page destinations returned 200 after following redirects. The eight image elements had alt attributes. The audit did not exercise authenticated media or content hidden by the live rendering failure. |
| Missing, short, long and duplicate titles; missing and duplicate descriptions; H1 missing, repeated, or identical to title | One 51-character title and one 186-character description. Zero H1s live. The patch restores the original hero heading and shortens the description. Cross-page duplicate checks require comparison after the page sequence. |
| Duplicate content, WWW resolution, HTTP homepage canonical or permanent redirect, broken or multiple canonicals, redirect chains, loops, meta refresh, temporary and permanent redirects | One reachable HTTPS www canonical. HTTP upgrades to HTTPS. The bare HTTPS host also served the page with 200. The patch redirects that host to www with 308 and preserves the path and query. No meta refresh or redirect loop observed. The locale switch uses redirects. Duplicate body checks across other routes are pending. |
| Insecure pages, HTTPS encryption, mixed content, outbound HTTP links, HSTS | HTTPS homepage loaded. No mixed-content resource or plain HTTP anchor found in initial markup. HSTS was absent from the observed live response. The patch adds it on production responses. |
| Certificate expiry, certificate name, old TLS versions, weak algorithms, SNI | Origin-level verification pending. The audit client uses an HTTPS intermediary. Its TLS session cannot establish the origin's certificate chain, accepted protocol/cipher list or SNI configuration. |
| Robots availability and format, crawl blocks, X-Robots-Tag, blocked internal or external resources, sitemap declaration | Live robots.txt parsed, permits the homepage and its initial same-origin src paths, and names the HTTPS sitemap. The homepage declares index/follow and had no noindex response header. External crawler permissions depend on the resource host. |
| Missing, malformed, oversized or incorrect sitemap; HTTP entries, sitemap orphans | A live XML sample parsed as a sitemap with 25 unique HTTPS locations, including the homepage, in 4,314 bytes. Another response was 37,887 bytes. Full URL validity, completeness and orphan status remain pending until all pages and inbound links are checked. |
| Viewport missing or width missing, encoding, doctype, frames and plugins | Device-width viewport, UTF-8 and HTML doctype present. One titled, hidden Google Tag Manager noscript iframe. No legacy frame, object or embed elements. |
| AMP canonical, hreflang values, conflicts, targets, language mismatch, missing lang/hreflang | English document language present. No AMP alternate or hreflang declarations in this HTML. Language selection uses a cookie; no separate crawlable French equivalent established for hreflang testing. |
| Large HTML, slow HTML response, low text/HTML ratio, low word count, excessive content | The first response contained 69,362 decoded HTML bytes, 264 whitespace-delimited body words and 1,551 bytes of extracted text. Two network observations took 3.07 and 0.17 seconds to headers. These measurements include the audit network. The missing hero affected live content measurements. |
| Compression, caching, minification, size and number of JS/CSS assets | Homepage was gzipped. HTML referenced 25 script elements with src and five stylesheet links. Successfully returned Next chunks included gzip and immutable cache headers. The 15 error responses prevent a meaningful total of the intended deployed bundles or full minification verification. |
| Link count, link depth, only one internal link, Analytics orphans | Homepage is depth zero with 31 anchor elements. Sitewide incoming-link counts, full navigation depth and orphans require the remaining crawl. Analytics-only orphans also require a GA4 page export for the same property and period. |
| URL longer than 200 characters, long link URLs, parameters, underscores, resources as page links, nofollow | The homepage path is /. The longest literal anchor href was 28 characters. No anchor carried nofollow. Locale actions included two query keys. No downloadable page asset disguised as a navigation link was identified. |
| Empty or non-descriptive anchor text | Four footer social icons all led to / and the mobile account link had no accessible name in the live HTML. The patch removes the placeholder destinations and names the icon-only sign-in link. |
| Invalid structured data | Both JSON-LD blocks parsed. They included Organization, WebSite, OnlineStore, WebPage, BreadcrumbList, FAQPage and ItemList. Parsing alone does not establish rich-result eligibility. |
| llms.txt missing or malformed | File returned 200. It contains a Markdown H1, summary, grouped public page links and sitemap reference. |
| Outdated content, semantic HTML, content optimization | Header, nav, main and footer landmarks present. The live homepage omitted its public landing copy and main heading. The patch restores that content. Currentness of business claims such as charity verification and market availability requires owner or catalog evidence. |

## Local production retest

The frontend production build and TypeScript checks completed. All eight existing unit tests passed. On the built homepage, Chromium found exactly one main heading with JavaScript off and on. All 28 unique JavaScript and stylesheet URLs checked against this build returned 200. The homepage response carried HSTS. A request with the bare host for /about?q=test returned 308 to https://www.angelpage.shop/about?q=test. The local build used a local API address, so these observations validate the frontend shell and assets, not live catalog records.

## Release check

Test a staging or production deployment produced from this branch. For the static asset failures, compare the hashes named by its homepage HTML against the files the hosting layer serves. Verify that both come from the same build across replicas and caches. The hosting configuration responsible for the live 400s has not been identified. Repeat the homepage requests and browser check at the deployed URL before clearing page one and advancing to About.
