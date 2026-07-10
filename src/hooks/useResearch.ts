import { useEffect, useState } from 'react';
import { Article, Trial, searchPubMed, searchTrials } from '../services/research';

export function useResearch(topic: string | null) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!topic) {
      setArticles([]);
      setTrials([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.allSettled([searchPubMed(topic), searchTrials(topic)]).then(([pubmed, trialsRes]) => {
      if (cancelled) return;
      setArticles(pubmed.status === 'fulfilled' ? pubmed.value : []);
      setTrials(trialsRes.status === 'fulfilled' ? trialsRes.value : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [topic]);

  return { articles, trials, loading };
}
