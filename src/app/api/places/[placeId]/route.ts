import { fail, ok } from "@/lib/http/api-response";
import { getCafeByPlaceId } from "@/lib/google-places/client";
import { coordinatesSchema, searchParamsToObject } from "@/lib/validation/schemas";

type RouteContext = {
  params: Promise<{
    placeId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { placeId } = await context.params;
  const url = new URL(request.url);
  const parsed = coordinatesSchema.partial().safeParse(searchParamsToObject(url.searchParams));

  if (!parsed.success) {
    return fail("INVALID_QUERY", "latitude and longitude must be valid when provided.");
  }

  try {
    const origin =
      parsed.data.latitude !== undefined && parsed.data.longitude !== undefined
        ? {
            latitude: parsed.data.latitude,
            longitude: parsed.data.longitude,
          }
        : undefined;

    const result = await getCafeByPlaceId(placeId, origin);

    if (!result.cafe) {
      return fail("PLACE_NOT_FOUND", "Cafe was not found.", 404);
    }

    return ok({
      source: result.source,
      cafe: result.cafe,
    });
  } catch {
    return fail("PLACES_UNAVAILABLE", "Cafe detail is temporarily unavailable.", 502);
  }
}
