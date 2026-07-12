import { cacheGet, cacheSet } from './cache';

export interface ExerciseInfo {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  secondaryMuscles: string[];
  equipment: string;
  mediaUrl: string | null;
  mediaType: 'gif' | 'image' | null;
  instructions: string[];
  level: string | null;
}

const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days — both sources are near-static
const FREE_DB_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main';

let inFlight: Promise<ExerciseInfo[]> | null = null;

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeExerciseDb(e: any, rapidKey: string): ExerciseInfo {
  // Current ExerciseDB plans no longer inline a gifUrl in the list response —
  // GIFs come from a separate per-exercise /image endpoint (still needs the
  // RapidAPI key, so we pass it through as a query param the <img> tag can use).
  const mediaUrl = e.gifUrl || (e.id ? `https://exercisedb.p.rapidapi.com/image?exerciseId=${e.id}&resolution=180&rapidapi-key=${rapidKey}` : null);
  return {
    id: `edb-${e.id}`,
    name: e.name,
    bodyPart: e.bodyPart || 'other',
    target: e.target || '',
    secondaryMuscles: e.secondaryMuscles || [],
    equipment: e.equipment || 'body weight',
    mediaUrl,
    mediaType: mediaUrl ? 'gif' : null,
    instructions: e.instructions || [],
    level: null,
  };
}

function normalizeFreeDb(e: any, index: number): ExerciseInfo {
  return {
    id: `free-${e.id ?? index}`,
    name: e.name,
    bodyPart: e.category || 'other',
    target: (e.primaryMuscles || [])[0] || '',
    secondaryMuscles: e.secondaryMuscles || [],
    equipment: e.equipment || 'body weight',
    mediaUrl: e.images?.length ? `${FREE_DB_BASE}/exercises/${e.images[0]}` : null,
    mediaType: e.images?.length ? 'image' : null,
    instructions: e.instructions || [],
    level: e.level || null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function fetchFromExerciseDb(key: string): Promise<ExerciseInfo[]> {
  const res = await fetch('https://exercisedb.p.rapidapi.com/exercises?limit=1400&offset=0', {
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
    },
  });
  if (!res.ok) throw new Error(`ExerciseDB ${res.status}`);
  const data = await res.json();
  return (data as unknown[]).map((e) => normalizeExerciseDb(e, key));
}

async function fetchFromFreeDb(): Promise<ExerciseInfo[]> {
  const res = await fetch(`${FREE_DB_BASE}/dist/exercises.json`);
  if (!res.ok) throw new Error(`free-exercise-db ${res.status}`);
  const data = await res.json();
  return (data as unknown[]).map(normalizeFreeDb);
}

// Full library, cached. ExerciseDB (GIF demos) when a RapidAPI key is present;
// free-exercise-db (static images) otherwise or on failure.
export async function getExerciseLibrary(): Promise<ExerciseInfo[]> {
  const cached = cacheGet<ExerciseInfo[]>('exercise-library');
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const rapidKey = import.meta.env.VITE_RAPIDAPI_KEY;
    let library: ExerciseInfo[];
    if (rapidKey) {
      try {
        library = await fetchFromExerciseDb(rapidKey);
      } catch {
        library = await fetchFromFreeDb();
      }
    } else {
      library = await fetchFromFreeDb();
    }
    cacheSet('exercise-library', library, TTL);
    inFlight = null;
    return library;
  })();

  return inFlight;
}
