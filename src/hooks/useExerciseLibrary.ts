import { useEffect, useMemo, useState } from 'react';
import { ExerciseInfo, getExerciseLibrary } from '../services/exercises';

export interface ExerciseFilters {
  query: string;
  bodyPart: string; // '' = all
  equipment: string; // '' = all
}

export function useExerciseLibrary() {
  const [library, setLibrary] = useState<ExerciseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState<ExerciseFilters>({ query: '', bodyPart: '', equipment: '' });

  useEffect(() => {
    let cancelled = false;
    getExerciseLibrary()
      .then((lib) => {
        if (!cancelled) setLibrary(lib);
      })
      .catch((e) => {
        console.error('Error loading exercise library:', e);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const bodyParts = useMemo(
    () => Array.from(new Set(library.map((e) => e.bodyPart))).filter(Boolean).sort(),
    [library]
  );
  const equipments = useMemo(
    () => Array.from(new Set(library.map((e) => e.equipment))).filter(Boolean).sort(),
    [library]
  );

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return library.filter(
      (e) =>
        (!filters.bodyPart || e.bodyPart === filters.bodyPart) &&
        (!filters.equipment || e.equipment === filters.equipment) &&
        (!q || e.name.toLowerCase().includes(q) || e.target.toLowerCase().includes(q))
    );
  }, [library, filters]);

  return { library, filtered, loading, error, filters, setFilters, bodyParts, equipments };
}
