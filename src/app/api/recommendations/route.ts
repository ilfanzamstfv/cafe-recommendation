import { rankCafes } from "@/features/recommendation/calculate-score";
import { excludeNotInterestedCafes } from "@/features/recommendation/exclude-not-interested";
import { getInteractionSignal, getPreference } from "@/features/user/user-store";
import { fail, ok } from "@/lib/http/api-response";
import { getNearbyCafes } from "@/lib/google-places/client";
import { isAuthFailure, requireAuth } from "@/lib/supabase/server";
import { recommendationQuerySchema, searchParamsToObject } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const auth = await requireAuth(request);

  if (isAuthFailure(auth)) {
    return auth;
  }

  const url = new URL(request.url);
  const parsed = recommendationQuerySchema.safeParse(searchParamsToObject(url.searchParams));

  if (!parsed.success) {
    return fail("INVALID_QUERY", "latitude, longitude, and radius are required.");
  }

  try {
    const { latitude, longitude, radius } = parsed.data;
    const preference = await getPreference(auth);
    const interactionSignal = await getInteractionSignal(auth);
    const nearby = await getNearbyCafes({ latitude, longitude }, radius);
    const availableCafes = excludeNotInterestedCafes(nearby.cafes, interactionSignal.notInterestedPlaceIds);
    const cafes = rankCafes(availableCafes, preference, interactionSignal);

    return ok({
      source: nearby.source,
      userId: auth.user.id,
      preference,
      interactionSignal,
      cafes,
    });
  } catch {
    return fail("RECOMMENDATION_UNAVAILABLE", "Recommendation engine is temporarily unavailable.", 502);
  }
}
