import { supabase } from '../lib/supabase';

const SEMRUSH_API_KEY = process.env.SEMRUSH_API_KEY ?? '';
const SEMRUSH_BASE = 'https://api.semrush.com';

// ── Types ────────────────────────────────────────────────────────

export interface KeywordResult {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  trend: number[];
  results: number;
}

export interface DomainOverview {
  domain: string;
  organicTraffic: number;
  organicKeywords: number;
  domainAuthority: number;
  backlinks: number;
  paidTraffic: number;
  paidKeywords: number;
  topKeywords: KeywordResult[];
}

// ── Keyword Research ─────────────────────────────────────────────

export async function fetchKeywords(
  keyword: string,
  organizationId: string,
  database = 'us',
): Promise<KeywordResult[]> {
  // Check cache (< 24h old)
  const { data: cached } = await supabase
    .from('semrush_snapshots')
    .select('data')
    .eq('organization_id', organizationId)
    .eq('query_type', 'keywords')
    .eq('query_input', keyword)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (cached?.data) return cached.data as unknown as KeywordResult[];

  let results: KeywordResult[];

  if (SEMRUSH_API_KEY) {
    // Real API call
    const url = `${SEMRUSH_BASE}/?type=phrase_related&key=${SEMRUSH_API_KEY}&phrase=${encodeURIComponent(keyword)}&database=${database}&export_columns=Ph,Nq,Cp,Co,Nr&display_limit=20`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`SEMrush API error: ${res.status}`);

    const text = await res.text();
    const lines = text.trim().split('\n');
    // Skip header row
    results = lines.slice(1).map((line) => {
      const [ph, nq, cp, co, nr] = line.split(';');
      return {
        keyword: ph,
        volume: parseInt(nq) || 0,
        cpc: parseFloat(cp) || 0,
        competition: parseFloat(co) || 0,
        trend: [],
        results: parseInt(nr) || 0,
      };
    });
  } else {
    // Mock data for development / demo
    results = generateMockKeywords(keyword);
  }

  // Cache results
  await supabase.from('semrush_snapshots').insert({
    organization_id: organizationId,
    query_type: 'keywords',
    query_input: keyword,
    data: results as unknown as Record<string, unknown>,
  });

  return results;
}

// ── Domain Overview ──────────────────────────────────────────────

export async function fetchDomainOverview(
  domain: string,
  organizationId: string,
  database = 'us',
): Promise<DomainOverview> {
  // Check cache (< 24h old)
  const { data: cached } = await supabase
    .from('semrush_snapshots')
    .select('data')
    .eq('organization_id', organizationId)
    .eq('query_type', 'domain-overview')
    .eq('query_input', domain)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (cached?.data) return cached.data as unknown as DomainOverview;

  let overview: DomainOverview;

  if (SEMRUSH_API_KEY) {
    const url = `${SEMRUSH_BASE}/?type=domain_ranks&key=${SEMRUSH_API_KEY}&export_columns=Dn,Or,Ot,Oc,Ad,At&domain=${encodeURIComponent(domain)}&database=${database}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`SEMrush API error: ${res.status}`);

    const text = await res.text();
    const lines = text.trim().split('\n');
    const values = lines[1]?.split(';') ?? [];

    overview = {
      domain: values[0] ?? domain,
      organicKeywords: parseInt(values[1]) || 0,
      organicTraffic: parseInt(values[2]) || 0,
      backlinks: parseInt(values[3]) || 0,
      paidKeywords: parseInt(values[4]) || 0,
      paidTraffic: parseInt(values[5]) || 0,
      domainAuthority: 0, // SEMrush Authority Score requires separate endpoint
      topKeywords: [],
    };
  } else {
    overview = generateMockDomainOverview(domain);
  }

  // Cache results
  await supabase.from('semrush_snapshots').insert({
    organization_id: organizationId,
    query_type: 'domain-overview',
    query_input: domain,
    data: overview as unknown as Record<string, unknown>,
  });

  return overview;
}

// ── Mock data generators ─────────────────────────────────────────

function generateMockKeywords(seed: string): KeywordResult[] {
  const prefixes = ['best', 'top', 'how to', 'free', 'cheap', 'professional', 'online'];
  const suffixes = ['tools', 'software', 'services', 'agency', 'tips', 'guide', 'examples'];

  return [
    { keyword: seed, volume: 14800, cpc: 3.45, competition: 0.82, trend: [80, 85, 90, 88, 92, 95], results: 245000000 },
    ...prefixes.slice(0, 5).map((p, i) => ({
      keyword: `${p} ${seed}`,
      volume: Math.floor(8000 / (i + 1)),
      cpc: +(Math.random() * 5 + 0.5).toFixed(2),
      competition: +(Math.random() * 0.4 + 0.4).toFixed(2),
      trend: Array.from({ length: 6 }, () => Math.floor(Math.random() * 30 + 60)),
      results: Math.floor(Math.random() * 100000000),
    })),
    ...suffixes.slice(0, 5).map((s, i) => ({
      keyword: `${seed} ${s}`,
      volume: Math.floor(6000 / (i + 1)),
      cpc: +(Math.random() * 4 + 0.8).toFixed(2),
      competition: +(Math.random() * 0.5 + 0.3).toFixed(2),
      trend: Array.from({ length: 6 }, () => Math.floor(Math.random() * 30 + 50)),
      results: Math.floor(Math.random() * 80000000),
    })),
  ];
}

function generateMockDomainOverview(domain: string): DomainOverview {
  return {
    domain,
    organicTraffic: 284500,
    organicKeywords: 18420,
    domainAuthority: 62,
    backlinks: 45200,
    paidTraffic: 12400,
    paidKeywords: 890,
    topKeywords: generateMockKeywords(domain.replace(/\.[^.]+$/, '')).slice(0, 5),
  };
}
