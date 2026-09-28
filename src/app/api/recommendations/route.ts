import { rankCafes } from "@/features/recommendation/calculate-score";
import { getPreference } from "@/features/user/demo-store";
import { fail, ok } from "@/lib/http/api-response";
import { getNearbyCafes } from "@/lib/google-places/client";
import { recommendationQuerySchema, searchParamsToObject } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = recommendationQuerySchema.safeParse(searchParamsToObject(url.searchParams));

  if (!parsed.success) {
    return fail("INVALID_QUERY", "latitude, longitude, and radius are required.");
  }

  try {
    const { latitude, longitude, radius, userId } = parsed.data;
    const preference = getPreference(userId);
    const nearby = await getNearbyCafes({ latitude, longitude }, radius);
    const cafes = rankCafes(nearby.cafes, preference);

    return ok({
      source: nearby.source,
      userId,
      preference,
      cafes,
    });
  } catch {
    return fail("RECOMMENDATION_UNAVAILABLE", "Recommendation engine is temporarily unavailable.", 502);
  }
}
