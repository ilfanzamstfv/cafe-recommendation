import type { Cafe, Coordinates } from "@/types/cafe";
import { getDistanceKm } from "@/lib/geo/distance";
import { mockCafes } from "@/lib/google-places/mock-data";
import { normalizeGooglePlace } from "@/lib/google-places/normalize";

const NEARBY_SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby";
const PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.currentOpeningHours",
  "places.regularOpeningHours",
  "places.primaryType",
  "places.photos",
  "places.googleMapsUri",
].join(",");

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "location",
  "rating",
  "userRatingCount",
  "priceLevel",
  "currentOpeningHours",
  "regularOpeningHours",
  "primaryType",
  "photos",
  "googleMapsUri",
].join(",");

function addDistance(cafes: Cafe[], origin: Coordinates) {
  return cafes.map((cafe) => ({
    ...cafe,
    distanceKm: getDistanceKm(origin, cafe.location),
  }));
}

function getMockNearby(origin: Coordinates, radiusMeters: number) {
  return addDistance(mockCafes, origin)
    .filter((cafe) => (cafe.distanceKm ?? Number.POSITIVE_INFINITY) <= radiusMeters / 1000)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

export async function getNearbyCafes(origin: Coordinates, radiusMeters: number) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return {
      source: "mock" as const,
      cafes: getMockNearby(origin, radiusMeters),
    };
  }

  const response = await fetch(NEARBY_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: ["cafe", "coffee_shop"],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: origin.latitude,
            longitude: origin.longitude,
          },
          radius: radiusMeters,
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Google Places nearby search failed");
  }

  const payload = (await response.json()) as { places?: unknown[] };
  const cafes = (payload.places ?? [])
    .map((place) => normalizeGooglePlace(place as Parameters<typeof normalizeGooglePlace>[0]))
    .filter((place): place is Cafe => Boolean(place));

  return {
    source: "google_places" as const,
    cafes: addDistance(cafes, origin),
  };
}

export async function getCafeByPlaceId(placeId: string, origin?: Coordinates) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    const cafe = mockCafes.find((item) => item.placeId === placeId) ?? null;

    return {
      source: "mock" as const,
      cafe:
        cafe && origin
          ? {
              ...cafe,
              distanceKm: getDistanceKm(origin, cafe.location),
            }
          : cafe,
    };
  }

  const response = await fetch(`${PLACE_DETAILS_URL}/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": DETAILS_FIELD_MASK,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Google Places detail lookup failed");
  }

  const cafe = normalizeGooglePlace(await response.json());

  return {
    source: "google_places" as const,
    cafe:
      cafe && origin
        ? {
            ...cafe,
            distanceKm: getDistanceKm(origin, cafe.location),
          }
        : cafe,
  };
}
