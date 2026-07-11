export type WeightUnit = 'kg' | 'lbs';

const KG_TO_LBS = 2.20462;

export function convertWeight(kg: number, unit: WeightUnit): number {
  return unit === 'lbs' ? kg * KG_TO_LBS : kg;
}

export function formatWeight(kg: number, unit: WeightUnit, digits = 1): string {
  return `${convertWeight(kg, unit).toFixed(digits)} ${unit}`;
}
