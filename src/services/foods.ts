import { cachedFetchJson } from './cache';

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Micronutrient {
  label: string;
  value: number;
  unit: string;
}

export interface FoodItem {
  id: string;
  source: 'off' | 'usda';
  name: string;
  brand: string | null;
  barcode: string | null;
  imageUrl: string | null;
  per100g: Macros & { fiber?: number; sugar?: number; sodium?: number };
  servingDesc: string | null;
  nutriScore: string | null; // a–e (Open Food Facts only)
  allergens: string[];
  ingredientsText: string | null;
  micronutrients: Micronutrient[];
}

const TTL = 24 * 60 * 60 * 1000; // 24h

const OFF_FIELDS =
  'code,product_name,brands,nutriments,serving_size,image_small_url,image_url,nutriscore_grade,allergens_tags,ingredients_text';

/* eslint-disable @typescript-eslint/no-explicit-any */
function num(v: any): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function offMicros(nutriments: any): Micronutrient[] {
  const map: [string, string, string][] = [
    ['fiber_100g', 'Fiber', 'g'],
    ['sugars_100g', 'Sugars', 'g'],
    ['saturated-fat_100g', 'Saturated fat', 'g'],
    ['sodium_100g', 'Sodium', 'g'],
    ['salt_100g', 'Salt', 'g'],
    ['calcium_100g', 'Calcium', 'mg'],
    ['iron_100g', 'Iron', 'mg'],
    ['potassium_100g', 'Potassium', 'mg'],
    ['vitamin-c_100g', 'Vitamin C', 'mg'],
    ['vitamin-d_100g', 'Vitamin D', 'µg'],
  ];
  return map
    .filter(([key]) => nutriments?.[key] != null && num(nutriments[key]) > 0)
    .map(([key, label, unit]) => {
      let value = num(nutriments[key]);
      // OFF reports minerals/vitamins in grams; show mg/µg
      if (unit === 'mg') value = value * 1000;
      if (unit === 'µg') value = value * 1_000_000;
      return { label, value: parseFloat(value.toPrecision(3)), unit };
    });
}

function normalizeOff(p: any): FoodItem | null {
  if (!p?.product_name) return null;
  const n = p.nutriments || {};
  return {
    id: `off-${p.code}`,
    source: 'off',
    name: p.product_name,
    brand: p.brands ? String(p.brands).split(',')[0].trim() : null,
    barcode: p.code || null,
    imageUrl: p.image_small_url || p.image_url || null,
    per100g: {
      calories: Math.round(num(n['energy-kcal_100g'] ?? n.energy_kcal_100g)),
      protein: num(n.proteins_100g),
      carbs: num(n.carbohydrates_100g),
      fat: num(n.fat_100g),
      fiber: num(n.fiber_100g) || undefined,
      sugar: num(n.sugars_100g) || undefined,
      sodium: num(n.sodium_100g) || undefined,
    },
    servingDesc: p.serving_size || null,
    nutriScore: p.nutriscore_grade && p.nutriscore_grade !== 'unknown' ? p.nutriscore_grade : null,
    allergens: (p.allergens_tags || []).map((t: string) => t.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ')),
    ingredientsText: p.ingredients_text || null,
    micronutrients: offMicros(n),
  };
}

const USDA_NUTRIENT_IDS: Record<number, keyof Macros> = {
  1008: 'calories',
  1003: 'protein',
  1005: 'carbs',
  1004: 'fat',
};

function normalizeUsda(f: any): FoodItem | null {
  if (!f?.description) return null;
  const macros: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const micros: Micronutrient[] = [];
  for (const n of f.foodNutrients || []) {
    const key = USDA_NUTRIENT_IDS[n.nutrientId];
    if (key) {
      macros[key] = num(n.value);
    } else if (n.value > 0 && ['Fiber, total dietary', 'Sugars, total including NLEA', 'Sodium, Na', 'Calcium, Ca', 'Iron, Fe', 'Potassium, K', 'Vitamin C, total ascorbic acid'].includes(n.nutrientName)) {
      micros.push({ label: n.nutrientName.split(',')[0], value: num(n.value), unit: n.unitName?.toLowerCase() || '' });
    }
  }
  return {
    id: `usda-${f.fdcId}`,
    source: 'usda',
    name: f.description,
    brand: f.brandOwner || f.brandName || null,
    barcode: f.gtinUpc || null,
    imageUrl: null,
    per100g: { ...macros, calories: Math.round(macros.calories) },
    servingDesc: f.servingSize ? `${f.servingSize} ${f.servingSizeUnit || 'g'}` : null,
    nutriScore: null,
    allergens: [],
    ingredientsText: f.ingredients || null,
    micronutrients: micros,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function searchFoods(query: string): Promise<FoodItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&fields=${OFF_FIELDS}`;
  const usdaKey = import.meta.env.VITE_USDA_API_KEY;

  const requests: Promise<FoodItem[]>[] = [
    cachedFetchJson<{ products: unknown[] }>(offUrl, TTL)
      .then((r) => (r.products || []).map(normalizeOff).filter((f): f is FoodItem => f !== null))
      .catch(() => []),
  ];

  if (usdaKey) {
    const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaKey}&query=${encodeURIComponent(q)}&pageSize=10&dataType=Branded,Foundation`;
    requests.push(
      cachedFetchJson<{ foods: unknown[] }>(usdaUrl, TTL)
        .then((r) => (r.foods || []).map(normalizeUsda).filter((f): f is FoodItem => f !== null))
        .catch(() => [])
    );
  }

  const results = (await Promise.all(requests)).flat();
  // de-dupe by barcode, prefer OFF (has images + Nutri-Score)
  const seen = new Set<string>();
  return results.filter((f) => {
    const key = f.barcode || f.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return f.per100g.calories > 0 || f.per100g.protein > 0;
  });
}

export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  const code = barcode.trim().replace(/\D/g, '');
  if (!code) return null;
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}`;
    const r = await cachedFetchJson<{ status: number; product: unknown }>(url, TTL);
    if (r.status !== 1) return null;
    return normalizeOff(r.product);
  } catch {
    return null;
  }
}
