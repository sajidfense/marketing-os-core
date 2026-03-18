import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { SEO_ANALYST_SYSTEM_PROMPT } from '../lib/prompts/seo-analyst';
import {
  fetchPageSpeedData,
  scrapeOnPageSEO,
  buildSEOAnalysisPrompt,
  type PageSpeedResult,
} from '../services/seo.service';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SEO_MODEL = 'claude-sonnet-4-6';

function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    // Block private/internal IPs and localhost to prevent SSRF
    const host = u.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('172.') ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host === 'metadata.google.internal' ||
      host === '169.254.169.254'
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function analyseUrl(req: Request, res: Response): Promise<void> {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== 'string' || !isValidHttpUrl(url.trim())) {
    res.status(400).json({ error: 'A valid http/https URL is required in the request body.' });
    return;
  }

  const normalised = url.trim();

  // Set SSE headers immediately
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  function sendEvent(payload: Record<string, unknown>): void {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  try {
    // Fetch PageSpeed and scrape HTML in parallel
    const [pageSpeedResult, onPageResult] = await Promise.allSettled([
      fetchPageSpeedData(normalised),
      scrapeOnPageSEO(normalised),
    ]);

    const pageSpeed: PageSpeedResult | null =
      pageSpeedResult.status === 'fulfilled' ? pageSpeedResult.value : null;

    if (pageSpeedResult.status === 'rejected') {
      console.warn('[seo] PageSpeed fetch failed:', pageSpeedResult.reason);
    }

    const onPage =
      onPageResult.status === 'fulfilled'
        ? onPageResult.value
        : {
            url: normalised,
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
            fetchError: onPageResult.status === 'rejected'
              ? String((onPageResult as PromiseRejectedResult).reason)
              : 'Unknown error',
          };

    // Send scores + CWV metadata so the frontend can display them immediately
    if (pageSpeed) {
      sendEvent({
        type: 'scores',
        performanceScore: pageSpeed.performanceScore,
        seoScore: pageSpeed.seoScore,
        accessibilityScore: pageSpeed.accessibilityScore,
        cwv: {
          lcp: pageSpeed.lcp,
          inp: pageSpeed.inp,
          cls: pageSpeed.cls,
          fcp: pageSpeed.fcp,
          ttfb: pageSpeed.ttfb,
        },
      });
    }

    const userPrompt = buildSEOAnalysisPrompt(normalised, pageSpeed, onPage);

    // Stream Claude response
    const stream = await anthropic.messages.stream({
      model: SEO_MODEL,
      max_tokens: 4096,
      system: SEO_ANALYST_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        sendEvent({ type: 'delta', content: event.delta.text });
      }
    }

    sendEvent({ type: 'done' });
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'SEO analysis failed';
    console.error('[seo] analyseUrl error:', err);
    sendEvent({ type: 'error', message });
    res.end();
  }
}
