import * as cheerio from 'cheerio';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CoreWebVital {
  displayValue: string;
  score: number | null;
  numericValue: number | null;
}

export interface PageSpeedOpportunity {
  id: string;
  title: string;
  description: string;
  displayValue?: string;
  score: number | null;
}

export interface PageSpeedResult {
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  lcp: CoreWebVital;
  inp: CoreWebVital;
  cls: CoreWebVital;
  fcp: CoreWebVital;
  ttfb: CoreWebVital;
  opportunities: PageSpeedOpportunity[];
  diagnostics: PageSpeedOpportunity[];
  fetchedAt: string;
}

export interface OnPageSEOData {
  url: string;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  metaRobots: string | null;
  canonicalUrl: string | null;
  h1Tags: string[];
  h2Tags: string[];
  h3Tags: string[];
  wordCount: number;
  imageCount: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  hasSchemaMarkup: boolean;
  schemaTypes: string[];
  openGraphTitle: string | null;
  openGraphDescription: string | null;
  openGraphImage: string | null;
  lang: string | null;
  viewport: string | null;
  fetchedAt: string;
  fetchError?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractAudit(audits: Record<string, unknown>, id: string): CoreWebVital {
  const audit = audits[id] as {
    displayValue?: string;
    score?: number | null;
    numericValue?: number | null;
  } | undefined;

  return {
    displayValue: audit?.displayValue ?? 'N/A',
    score: audit?.score ?? null,
    numericValue: audit?.numericValue ?? null,
  };
}

// ── fetchPageSpeedData ────────────────────────────────────────────────────────

export async function fetchPageSpeedData(url: string): Promise<PageSpeedResult> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  const endpoint =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
    `?url=${encodeURIComponent(url)}` +
    `&strategy=mobile` +
    `&category=performance` +
    `&category=seo` +
    `&category=accessibility` +
    (apiKey ? `&key=${apiKey}` : '');

  const res = await fetch(endpoint, { signal: AbortSignal.timeout(30_000) });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`PageSpeed API returned ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json() as Record<string, unknown>;
  const lr = data.lighthouseResult as Record<string, unknown>;
  const categories = lr.categories as Record<string, { score: number }>;
  const audits = lr.audits as Record<string, unknown>;

  const performanceScore = Math.round((categories.performance?.score ?? 0) * 100);
  const seoScore = Math.round((categories.seo?.score ?? 0) * 100);
  const accessibilityScore = Math.round((categories.accessibility?.score ?? 0) * 100);

  const lcp  = extractAudit(audits, 'largest-contentful-paint');
  const inp  = extractAudit(audits, 'experimental-interaction-to-next-paint') ?? extractAudit(audits, 'interaction-to-next-paint');
  const cls  = extractAudit(audits, 'cumulative-layout-shift');
  const fcp  = extractAudit(audits, 'first-contentful-paint');
  const ttfb = extractAudit(audits, 'server-response-time');

  // Opportunities: audits where details.type === 'opportunity' and score < 1
  const opportunities: PageSpeedOpportunity[] = Object.entries(audits)
    .filter(([, audit]) => {
      const a = audit as { details?: { type?: string }; score?: number | null };
      return a?.details?.type === 'opportunity' && a.score !== null && (a.score ?? 1) < 1;
    })
    .slice(0, 5)
    .map(([id, audit]) => {
      const a = audit as {
        title?: string;
        description?: string;
        displayValue?: string;
        score?: number | null;
      };
      return {
        id,
        title: a.title ?? id,
        description: a.description ?? '',
        displayValue: a.displayValue,
        score: a.score ?? null,
      };
    });

  // Diagnostics: audits where details.type === 'table' and score < 1
  const diagnostics: PageSpeedOpportunity[] = Object.entries(audits)
    .filter(([, audit]) => {
      const a = audit as { details?: { type?: string }; score?: number | null };
      return a?.details?.type === 'table' && a.score !== null && (a.score ?? 1) < 1;
    })
    .slice(0, 5)
    .map(([id, audit]) => {
      const a = audit as {
        title?: string;
        description?: string;
        displayValue?: string;
        score?: number | null;
      };
      return {
        id,
        title: a.title ?? id,
        description: a.description ?? '',
        displayValue: a.displayValue,
        score: a.score ?? null,
      };
    });

  return {
    performanceScore,
    seoScore,
    accessibilityScore,
    lcp,
    inp,
    cls,
    fcp,
    ttfb,
    opportunities,
    diagnostics,
    fetchedAt: new Date().toISOString(),
  };
}

// ── scrapeOnPageSEO ───────────────────────────────────────────────────────────

export async function scrapeOnPageSEO(url: string): Promise<OnPageSEOData> {
  const base: OnPageSEOData = {
    url,
    title: null,
    titleLength: 0,
    metaDescription: null,
    metaDescriptionLength: 0,
    metaRobots: null,
    canonicalUrl: null,
    h1Tags: [],
    h2Tags: [],
    h3Tags: [],
    wordCount: 0,
    imageCount: 0,
    imagesWithAlt: 0,
    imagesWithoutAlt: 0,
    internalLinks: 0,
    externalLinks: 0,
    hasSchemaMarkup: false,
    schemaTypes: [],
    openGraphTitle: null,
    openGraphDescription: null,
    openGraphImage: null,
    lang: null,
    viewport: null,
    fetchedAt: new Date().toISOString(),
  };

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; MarketingOS-SEOBot/1.0; +https://marketingos.io)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return { ...base, fetchError: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Title
    const title = $('title').first().text().trim() || null;
    base.title = title;
    base.titleLength = title?.length ?? 0;

    // Meta description
    const metaDesc =
      $('meta[name="description"]').attr('content')?.trim() ||
      $('meta[name="Description"]').attr('content')?.trim() ||
      null;
    base.metaDescription = metaDesc ?? null;
    base.metaDescriptionLength = metaDesc?.length ?? 0;

    // Meta robots
    base.metaRobots =
      $('meta[name="robots"]').attr('content')?.trim() ||
      $('meta[name="Robots"]').attr('content')?.trim() ||
      null;

    // Canonical
    base.canonicalUrl = $('link[rel="canonical"]').attr('href')?.trim() || null;

    // Headings
    base.h1Tags = $('h1')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);
    base.h2Tags = $('h2')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);
    base.h3Tags = $('h3')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    // Word count (body text)
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    base.wordCount = bodyText ? bodyText.split(' ').filter(Boolean).length : 0;

    // Images
    const images = $('img');
    base.imageCount = images.length;
    images.each((_, el) => {
      const alt = $(el).attr('alt');
      if (alt && alt.trim()) {
        base.imagesWithAlt++;
      } else {
        base.imagesWithoutAlt++;
      }
    });

    // Links
    const parsedUrl = new URL(url);
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      try {
        const linkUrl = new URL(href, url);
        if (linkUrl.hostname === parsedUrl.hostname) {
          base.internalLinks++;
        } else {
          base.externalLinks++;
        }
      } catch {
        // Relative or invalid link — count as internal
        if (href && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          base.internalLinks++;
        }
      }
    });

    // Schema markup
    const schemaScripts = $('script[type="application/ld+json"]');
    base.hasSchemaMarkup = schemaScripts.length > 0;
    const schemaTypes: string[] = [];
    schemaScripts.each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}') as Record<string, unknown>;
        const type = json['@type'];
        if (type) {
          schemaTypes.push(String(type));
        }
      } catch {
        // ignore malformed JSON-LD
      }
    });
    base.schemaTypes = schemaTypes;

    // Open Graph
    base.openGraphTitle =
      $('meta[property="og:title"]').attr('content')?.trim() || null;
    base.openGraphDescription =
      $('meta[property="og:description"]').attr('content')?.trim() || null;
    base.openGraphImage =
      $('meta[property="og:image"]').attr('content')?.trim() || null;

    // Lang
    base.lang = $('html').attr('lang')?.trim() || null;

    // Viewport
    base.viewport =
      $('meta[name="viewport"]').attr('content')?.trim() || null;

    return base;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ...base, fetchError: message };
  }
}

// ── buildSEOAnalysisPrompt ────────────────────────────────────────────────────

export function buildSEOAnalysisPrompt(
  url: string,
  pageSpeed: PageSpeedResult | null,
  onPage: OnPageSEOData,
): string {
  const lines: string[] = [];

  lines.push(`# SEO Analysis Request`);
  lines.push(`**URL:** ${url}`);
  lines.push(`**Analysed at:** ${new Date().toISOString()}`);
  lines.push('');

  // PageSpeed scores
  if (pageSpeed) {
    lines.push('## PageSpeed Insights Scores (Mobile)');
    lines.push(`- Performance: ${pageSpeed.performanceScore}/100`);
    lines.push(`- SEO: ${pageSpeed.seoScore}/100`);
    lines.push(`- Accessibility: ${pageSpeed.accessibilityScore}/100`);
    lines.push('');

    lines.push('## Core Web Vitals');
    lines.push(
      `- LCP (Largest Contentful Paint): ${pageSpeed.lcp.displayValue} (score: ${pageSpeed.lcp.score ?? 'N/A'}) — target: < 2.5s`,
    );
    lines.push(
      `- INP (Interaction to Next Paint): ${pageSpeed.inp.displayValue} (score: ${pageSpeed.inp.score ?? 'N/A'}) — target: < 200ms`,
    );
    lines.push(
      `- CLS (Cumulative Layout Shift): ${pageSpeed.cls.displayValue} (score: ${pageSpeed.cls.score ?? 'N/A'}) — target: < 0.1`,
    );
    lines.push(
      `- FCP (First Contentful Paint): ${pageSpeed.fcp.displayValue} (score: ${pageSpeed.fcp.score ?? 'N/A'}) — target: < 1.8s`,
    );
    lines.push(
      `- TTFB (Time to First Byte): ${pageSpeed.ttfb.displayValue} (score: ${pageSpeed.ttfb.score ?? 'N/A'}) — target: < 800ms`,
    );
    lines.push('');

    if (pageSpeed.opportunities.length > 0) {
      lines.push('## Top PageSpeed Opportunities');
      pageSpeed.opportunities.forEach((opp) => {
        lines.push(`- **${opp.title}**${opp.displayValue ? ` (${opp.displayValue})` : ''}: ${opp.description}`);
      });
      lines.push('');
    }

    if (pageSpeed.diagnostics.length > 0) {
      lines.push('## Top PageSpeed Diagnostics');
      pageSpeed.diagnostics.forEach((diag) => {
        lines.push(`- **${diag.title}**: ${diag.description}`);
      });
      lines.push('');
    }
  } else {
    lines.push('## PageSpeed Insights');
    lines.push('*PageSpeed data unavailable — could not reach the API.*');
    lines.push('');
  }

  // On-page SEO
  lines.push('## On-Page SEO Data');

  if (onPage.fetchError) {
    lines.push(`*Warning: HTML fetch encountered an issue: ${onPage.fetchError}. Some on-page data may be missing.*`);
  }

  lines.push(`- **Title:** ${onPage.title ?? '(MISSING)'} — ${onPage.titleLength} characters`);
  lines.push(
    `- **Meta Description:** ${onPage.metaDescription ?? '(MISSING)'} — ${onPage.metaDescriptionLength} characters`,
  );
  lines.push(`- **Meta Robots:** ${onPage.metaRobots ?? 'Not set (defaults to index, follow)'}`);
  lines.push(`- **Canonical URL:** ${onPage.canonicalUrl ?? 'Not set'}`);
  lines.push(`- **Language attribute:** ${onPage.lang ?? 'Not set'}`);
  lines.push(`- **Viewport meta:** ${onPage.viewport ?? 'Not set'}`);
  lines.push('');

  lines.push('### Heading Structure');
  lines.push(`- H1 tags (${onPage.h1Tags.length}): ${onPage.h1Tags.join(' | ') || '(NONE)'}`);
  lines.push(`- H2 tags (${onPage.h2Tags.length}): ${onPage.h2Tags.slice(0, 5).join(' | ') || '(NONE)'}${onPage.h2Tags.length > 5 ? ` ... +${onPage.h2Tags.length - 5} more` : ''}`);
  lines.push(`- H3 tags (${onPage.h3Tags.length})`);
  lines.push('');

  lines.push('### Content Signals');
  lines.push(`- Approximate word count: ${onPage.wordCount}`);
  lines.push(`- Total images: ${onPage.imageCount}`);
  lines.push(`- Images with alt text: ${onPage.imagesWithAlt}`);
  lines.push(`- Images WITHOUT alt text: ${onPage.imagesWithoutAlt}`);
  lines.push('');

  lines.push('### Link Profile');
  lines.push(`- Internal links: ${onPage.internalLinks}`);
  lines.push(`- External links: ${onPage.externalLinks}`);
  lines.push('');

  lines.push('### Schema & Social');
  lines.push(`- Schema markup present: ${onPage.hasSchemaMarkup ? 'Yes' : 'No'}${onPage.schemaTypes.length > 0 ? ` (types: ${onPage.schemaTypes.join(', ')})` : ''}`);
  lines.push(`- OG Title: ${onPage.openGraphTitle ?? 'Not set'}`);
  lines.push(`- OG Description: ${onPage.openGraphDescription ?? 'Not set'}`);
  lines.push(`- OG Image: ${onPage.openGraphImage ?? 'Not set'}`);
  lines.push('');

  lines.push('---');
  lines.push(
    'Please provide a full SEO analysis report based on the data above, following your report structure exactly.',
  );

  return lines.join('\n');
}
