// localStorage cache with TTL, quota-safe. Used by the external-API services
// to keep within rate limits (PubMed, Open Food Facts) and speed up reloads.
const PREFIX = 'ff-cache:';

interface Entry<T> {
  expires: number;
  data: T;
}

const memory = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const now = Date.now();
  const mem = memory.get(key) as Entry<T> | undefined;
  if (mem && mem.expires > now) return mem.data;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    if (entry.expires <= now) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    memory.set(key, entry);
    return entry.data;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  const entry: Entry<T> = { expires: Date.now() + ttlMs, data };
  memory.set(key, entry);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // quota exceeded — memory cache still holds it for this session
  }
}

export async function cachedFetchJson<T>(url: string, ttlMs: number, init?: RequestInit): Promise<T> {
  const key = `fetch:${url}`;
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = (await res.json()) as T;
  cacheSet(key, data, ttlMs);
  return data;
}
