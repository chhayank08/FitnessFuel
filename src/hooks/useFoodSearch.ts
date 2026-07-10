import { useCallback, useRef, useState } from 'react';
import { FoodItem, searchFoods, lookupBarcode } from '../services/foods';

export function useFoodSearch() {
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const requestId = useRef(0);

  const search = useCallback(async (query: string) => {
    const id = ++requestId.current;
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const items = await searchFoods(query);
      if (id === requestId.current) {
        setResults(items);
        setSearched(true);
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  const byBarcode = useCallback(async (code: string): Promise<FoodItem | null> => {
    setLoading(true);
    try {
      return await lookupBarcode(code);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, searched, search, byBarcode };
}
