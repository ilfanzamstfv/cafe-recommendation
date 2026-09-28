import { listFavorites, removeFavorite, saveFavorite } from "@/features/user/user-store";
import { fail, ok } from "@/lib/http/api-response";
import { getCafeByPlaceId } from "@/lib/google-places/client";
import { isAuthFailure, requireAuth } from "@/lib/supabase/server";
import { coordinatesSchema, favoriteSchema, searchParamsToObject } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const auth = await requireAuth(request);

  if (isAuthFailure(auth)) {
    return auth;
  }

  const url = new URL(request.url);
  const parsed = coordinatesSchema.partial().safeParse(searchParamsToObject(url.searchParams));

  if (!parsed.success) {
    return fail("INVALID_QUERY", "latitude and longitude must be valid when provided.");
  }

  const origin =
    parsed.data.latitude !== undefined && parsed.data.longitude !== undefined
      ? {
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
        }
      : undefined;
  try {
    const placeIds = await listFavorites(auth);
    const favorites = await Promise.all(
      placeIds.map(async (placeId) => {
        const result = await getCafeByPlaceId(placeId, origin);

        return result.cafe;
      }),
    );

    return ok({
      userId: auth.user.id,
      placeIds,
      cafes: favorites.filter((cafe) => Boolean(cafe)),
    });
  } catch {
    return fail("FAVORITES_UNAVAILABLE", "Favorites are temporarily unavailable.", 502);
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);

  if (isAuthFailure(auth)) {
    return auth;
  }

  const payload = await request.json().catch(() => null);
  const parsed = favoriteSchema.safeParse(payload);

  if (!parsed.success) {
    return fail("INVALID_BODY", "Favorite payload is invalid.");
  }

  try {
    return ok(
      {
        favorite: await saveFavorite(auth, parsed.data.placeId),
      },
      { status: 201 },
    );
  } catch {
    return fail("FAVORITES_UNAVAILABLE", "Favorite could not be saved.", 502);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuth(request);

  if (isAuthFailure(auth)) {
    return auth;
  }

  const url = new URL(request.url);
  const parsed = favoriteSchema.safeParse(searchParamsToObject(url.searchParams));

  if (!parsed.success) {
    return fail("INVALID_QUERY", "placeId is required.");
  }

  try {
    return ok({
      favorite: await removeFavorite(auth, parsed.data.placeId),
    });
  } catch {
    return fail("FAVORITES_UNAVAILABLE", "Favorite could not be removed.", 502);
  }
}
