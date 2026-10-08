import { z } from "zod";

export const coordinatesSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const nearbyQuerySchema = coordinatesSchema.extend({
  radius: z.coerce.number().positive().max(10000).default(3000),
});

export const recommendationQuerySchema = nearbyQuerySchema;

export const preferenceSchema = z.object({
  maxDistanceKm: z.coerce.number().positive().max(10),
  minimumRating: z.coerce.number().min(1).max(5),
  preferredPrice: z.enum(["BUDGET", "MEDIUM", "PREMIUM", "ANY"]),
  purposes: z
    .array(z.enum(["WORK", "STUDY", "HANGOUT", "DATE", "MEETING", "QUICK_COFFEE"]))
    .default([]),
});

export const interactionSchema = z.object({
  placeId: z.string().min(1),
  interactionType: z.enum(["LIKE", "UNLIKE", "SAVE", "VISITED", "NOT_INTERESTED"]),
});

export const favoriteSchema = z.object({
  placeId: z.string().min(1),
});

export function searchParamsToObject(searchParams: URLSearchParams) {
  return Object.fromEntries(searchParams.entries());
}
