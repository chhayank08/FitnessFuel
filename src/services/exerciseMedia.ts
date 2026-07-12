// Resolves demo media (GIF or photo) for catalog exercises by fuzzy-matching
// against the remote exercise library (ExerciseDB GIFs when a RapidAPI key is
// configured, free-exercise-db photos otherwise — getExerciseLibrary handles
// source choice and 7-day caching).

import { getExerciseLibrary, ExerciseInfo } from './exercises';
import type { CatalogExercise } from '../lib/exerciseCatalog';

export interface ExerciseMedia {
  url: string;
  type: 'gif' | 'image';
}

const resolved = new Map<string, ExerciseMedia | null>();

function scoreMatch(query: string, candidate: string): number {
  const q = query.toLowerCase();
  const c = candidate.toLowerCase();
  if (c === q) return 100;
  let score = 0;
  if (c.startsWith(q)) score += 40;
  else if (c.includes(q)) score += 25;
  const qWords = q.split(/[\s-]+/).filter(Boolean);
  const matched = qWords.filter((w) => c.includes(w)).length;
  score += (matched / qWords.length) * 30;
  // prefer bodyweight variants and shorter (more canonical) names
  if (c.includes('body weight') || c.includes('bodyweight')) score += 8;
  score -= Math.min(c.length / 10, 8);
  return score;
}

function findBest(query: string, library: ExerciseInfo[]): ExerciseInfo | null {
  let best: ExerciseInfo | null = null;
  let bestScore = 20; // minimum bar — below this, no match
  for (const e of library) {
    if (!e.mediaUrl) continue;
    const s = scoreMatch(query, e.name);
    if (s > bestScore) {
      best = e;
      bestScore = s;
    }
  }
  return best;
}

export async function resolveMedia(exercise: CatalogExercise): Promise<ExerciseMedia | null> {
  if (resolved.has(exercise.key)) return resolved.get(exercise.key) ?? null;
  try {
    const library = await getExerciseLibrary();
    const match = findBest(exercise.mediaQuery, library);
    const media = match?.mediaUrl ? { url: match.mediaUrl, type: match.mediaType ?? 'image' } : null;
    resolved.set(exercise.key, media);
    return media;
  } catch {
    // Offline / API failure: no media, caller renders a placeholder.
    return null;
  }
}

/** Warm the browser cache for an upcoming exercise's demo asset. */
export function preloadMedia(exercise: CatalogExercise): void {
  resolveMedia(exercise).then((media) => {
    if (media) {
      const img = new Image();
      img.src = media.url;
    }
  });
}
