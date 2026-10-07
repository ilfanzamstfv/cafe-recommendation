import type { Cafe, PricePreference } from "@/types/cafe";

type GooglePlace = {
  id?: string;
  displayName?: {
    text?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  regularOpeningHours?: {
    openNow?: boolean;
  };
  currentOpeningHours?: {
    openNow?: boolean;
  };
  primaryType?: string;
  photos?: Array<{
    name?: string;
    authorAttributions?: Array<{
      displayName?: string;
      uri?: string;
    }>;
  }>;
  googleMapsUri?: string;
};

function normalizePrice(priceLevel?: string): PricePreference | null {
  if (!priceLevel) {
    return null;
  }

  if (priceLevel === "PRICE_LEVEL_INEXPENSIVE") {
    return "BUDGET";
  }

  if (priceLevel === "PRICE_LEVEL_MODERATE") {
    return "MEDIUM";
  }

  if (
    priceLevel === "PRICE_LEVEL_EXPENSIVE" ||
    priceLevel === "PRICE_LEVEL_VERY_EXPENSIVE"
  ) {
    return "PREMIUM";
  }

  return null;
}

export function normalizeGooglePlace(place: GooglePlace): Cafe | null {
  if (
    !place.id ||
    !place.displayName?.text ||
    place.location?.latitude === undefined ||
    place.location.longitude === undefined
  ) {
    return null;
  }

  return {
    placeId: place.id,
    name: place.displayName.text,
    location: {
      latitude: place.location.latitude,
      longitude: place.location.longitude,
    },
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? 0,
    priceLevel: normalizePrice(place.priceLevel),
    isOpenNow:
      place.currentOpeningHours?.openNow ?? place.regularOpeningHours?.openNow ?? null,
    primaryType: place.primaryType ?? null,
    photoName: place.photos?.[0]?.name ?? null,
    photoAttributions: place.photos?.[0]?.authorAttributions?.flatMap((attribution) =>
      attribution.displayName
        ? [{ displayName: attribution.displayName, ...(attribution.uri ? { uri: attribution.uri } : {}) }]
        : [],
    ),
    googleMapsUri: place.googleMapsUri ?? null,
  };
}
