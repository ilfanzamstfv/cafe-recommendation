import type { Cafe, UserPreference } from "@/types/cafe";

export function getPreferenceScore(cafe: Cafe, preference: UserPreference) {
  let score = 50;

  if (cafe.rating && cafe.rating >= preference.minimumRating) {
    score += 20;
  }

  if (cafe.distanceKm !== undefined && cafe.distanceKm <= preference.maxDistanceKm) {
    score += 20;
  }

  if (preference.purposes.includes("QUICK_COFFEE") && cafe.distanceKm !== undefined && cafe.distanceKm <= 2) {
    score += 10;
  }

  if ((preference.purposes.includes("WORK") || preference.purposes.includes("STUDY")) && cafe.rating && cafe.rating >= 4.3) {
    score += 10;
  }

  return Math.min(score, 100);
}
