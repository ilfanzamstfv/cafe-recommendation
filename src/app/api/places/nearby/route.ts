import { fail, ok } from "@/lib/http/api-response";
import { getNearbyCafes } from "@/lib/google-places/client";
import { isAuthFailure, requireAuth } from "@/lib/supabase/server";
import { nearbyQuerySchema, searchParamsToObject } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const auth = await requireAuth(request);

  if (isAuthFailure(auth)) {
    return auth;
  }

  const url = new URL(request.url);
  const parsed = nearbyQuerySchema.safeParse(searchParamsToObject(url.searchParams));

  if (!parsed.success) {
    return fail("INVALID_QUERY", "latitude, longitude, and radius are required.");
  }

  try {
    const { latitude, longitude, radius } = parsed.data;
    const result = await getNearbyCafes({ latitude, longitude }, radius);

    return ok({
      source: result.source,
      userId: auth.user.id,
      radiusMeters: radius,
      cafes: result.cafes,
    });
  } catch {
    return fail("PLACES_UNAVAILABLE", "Cafe discovery is temporarily unavailable.", 502);
  }
}
