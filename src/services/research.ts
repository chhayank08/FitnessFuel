import { cachedFetchJson } from './cache';

export interface Article {
  id: string;
  title: string;
  journal: string;
  year: string;
  authors: string;
  url: string;
}

export interface Trial {
  id: string;
  title: string;
  status: string;
  conditions: string[];
  url: string;
}

export interface Recall {
  id: string;
  product: string;
  reason: string;
  date: string;
  classification: string;
}

const TTL = 24 * 60 * 60 * 1000;

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function searchPubMed(term: string, max = 8): Promise<Article[]> {
  const search = await cachedFetchJson<any>(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${max}&sort=relevance&term=${encodeURIComponent(term)}`,
    TTL
  );
  const ids: string[] = search?.esearchresult?.idlist || [];
  if (ids.length === 0) return [];

  const summary = await cachedFetchJson<any>(
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`,
    TTL
  );
  return ids
    .map((id) => summary?.result?.[id])
    .filter(Boolean)
    .map((r: any) => ({
      id: r.uid,
      title: r.title?.replace(/<\/?[^>]+>/g, '') || 'Untitled',
      journal: r.fulljournalname || r.source || '',
      year: (r.pubdate || '').split(' ')[0] || '',
      authors:
        (r.authors || [])
          .slice(0, 3)
          .map((a: any) => a.name)
          .join(', ') + ((r.authors || []).length > 3 ? ' et al.' : ''),
      url: `https://pubmed.ncbi.nlm.nih.gov/${r.uid}/`,
    }));
}

export async function searchTrials(term: string, max = 6): Promise<Trial[]> {
  const data = await cachedFetchJson<any>(
    `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(term)}&pageSize=${max}&filter.overallStatus=RECRUITING`,
    TTL
  );
  return (data?.studies || []).map((s: any) => {
    const ident = s.protocolSection?.identificationModule || {};
    return {
      id: ident.nctId || '',
      title: ident.briefTitle || 'Untitled study',
      status: s.protocolSection?.statusModule?.overallStatus || '',
      conditions: s.protocolSection?.conditionsModule?.conditions || [],
      url: `https://clinicaltrials.gov/study/${ident.nctId}`,
    };
  });
}

export async function searchRecalls(term: string, max = 6): Promise<Recall[]> {
  try {
    const data = await cachedFetchJson<any>(
      `https://api.fda.gov/food/enforcement.json?search=product_description:"${encodeURIComponent(term)}"&limit=${max}`,
      TTL
    );
    return (data?.results || []).map((r: any) => ({
      id: r.recall_number || r.event_id,
      product: r.product_description || '',
      reason: r.reason_for_recall || '',
      date: r.recall_initiation_date
        ? `${r.recall_initiation_date.slice(0, 4)}-${r.recall_initiation_date.slice(4, 6)}-${r.recall_initiation_date.slice(6, 8)}`
        : '',
      classification: r.classification || '',
    }));
  } catch {
    // openFDA returns 404 for zero matches
    return [];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Topic seeds per user goal — used by LearnPage chips and Evidence corners.
export function topicsForGoal(goal: string): string[] {
  const common = ['sleep and recovery athletes', 'hydration exercise performance'];
  switch (goal) {
    case 'weight_loss':
      return ['caloric deficit weight loss', 'protein intake satiety', 'resistance training fat loss', ...common];
    case 'muscle_gain':
      return ['resistance training hypertrophy', 'protein timing muscle synthesis', 'progressive overload', ...common];
    case 'weight_gain':
      return ['caloric surplus lean mass', 'strength training beginners', ...common];
    default:
      return ['physical activity guidelines adults', 'balanced diet health outcomes', ...common];
  }
}
