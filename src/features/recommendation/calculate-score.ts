import type { Cafe, RecommendedCafe, UserInteractionSignal, UserPreference } from "@/types/cafe";
import { getDistanceScore } from "@/features/recommendation/distance-score";
import { getPopularityScore } from "@/features/recommendation/popularity-score";
import { getPreferenceScore } from "@/features/recommendation/preference-score";
import { getPriceScore } from "@/features/recommendation/price-score";
import { getRatingScore } from "@/features/recommendation/rating-score";

const weights = {
  rating: 0.3,
  distance: 0.25,
  preference: 0.2,
  popularity: 0.1,
  price: 0.1,
  openStatus: 0.05,
};

function formatDistance(distanceKm: number | undefined) {
  if (distanceKm === undefined) {
    return null;
  }

  return `${distanceKm.toFixed(1)} km from you`;
}

function getInteractionScore(cafe: Cafe, signal?: UserInteractionSignal) {
  if (!signal) {
    return 50;
  }

  if (signal.notInterestedPlaceIds.includes(cafe.placeId)) {
    return 0;
  }

  if (signal.likedPlaceIds.includes(cafe.placeId) || signal.savedPlaceIds.includes(cafe.placeId)) {
    return 100;
  }

  if (signal.visitedPlaceIds.includes(cafe.placeId)) {
    return 80;
  }

  return 50;
}

function getReasons(cafe: Cafe, preference: UserPreference, signal?: UserInteractionSignal) {
  const reasons: string[] = [];
  const distanceReason = formatDistance(cafe.distanceKm);

  if (distanceReason) {
    reasons.push(distanceReason);
  }

  if (cafe.rating) {
    reasons.push(`Rating ${cafe.rating.toFixed(1)}`);
  }

  if (cafe.priceLevel && (preference.preferredPrice === "ANY" || cafe.priceLevel === preference.preferredPrice)) {
    reasons.push("Matches your preferred price");
  }

  if (cafe.isOpenNow) {
    reasons.push("Open now");
  }

  if (preference.purposes.length > 0) {
    reasons.push(`Aligned with ${preference.purposes.join(", ").toLowerCase()} preference`);
  }

  if (signal?.likedPlaceIds.includes(cafe.placeId) || signal?.savedPlaceIds.includes(cafe.placeId)) {
    reasons.push("Based on your previous interest");
  }

  if (signal?.notInterestedPlaceIds.includes(cafe.placeId)) {
    reasons.push("Ranked lower because you marked it not interested");
  }

  return reasons;
}

export function calculateRecommendation(
  cafe: Cafe,
  preference: UserPreference,
  signal?: UserInteractionSignal,
): RecommendedCafe {
  const scoreBreakdown = {
    rating: getRatingScore(cafe.rating),
    distance: getDistanceScore(cafe.distanceKm),
    preference: getPreferenceScore(cafe, preference),
    popularity: getPopularityScore(cafe.userRatingCount),
    price: getPriceScore(cafe.priceLevel, preference.preferredPrice),
    openStatus: cafe.isOpenNow ? 100 : 0,
    interaction: getInteractionScore(cafe, signal),
  };

  const baseScore = Math.round(
    scoreBreakdown.rating * weights.rating +
      scoreBreakdown.distance * weights.distance +
      scoreBreakdown.preference * weights.preference +
      scoreBreakdown.popularity * weights.popularity +
      scoreBreakdown.price * weights.price +
      scoreBreakdown.openStatus * weights.openStatus,
  );
  const interactionAdjustment = Math.round((scoreBreakdown.interaction - 50) * 0.3);
  const recommendationScore = Math.max(0, Math.min(100, baseScore + interactionAdjustment));

  return {
    ...cafe,
    recommendationScore,
    scoreBreakdown,
    reasons: getReasons(cafe, preference, signal),
  };
}

export function rankCafes(cafes: Cafe[], preference: UserPreference, signal?: UserInteractionSignal) {
  return cafes
    .map((cafe) => calculateRecommendation(cafe, preference, signal))
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
}
