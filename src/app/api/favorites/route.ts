import { listFavorites, removeFavorite, saveFavorite } from "@/features/user/demo-store";
import { fail, ok } from "@/lib/http/api-response";
import { favoriteSchema, searchParamsToObject } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? "demo-user";

  return ok({
    userId,
    placeIds: listFavorites(userId),
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = favoriteSchema.safeParse(payload);

  if (!parsed.success) {
    return fail("INVALID_BODY", "Favorite payload is invalid.");
  }

  return ok(
    {
      favorite: saveFavorite(parsed.data.userId, parsed.data.placeId),
    },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const parsed = favoriteSchema.safeParse(searchParamsToObject(url.searchParams));

  if (!parsed.success) {
    return fail("INVALID_QUERY", "userId and placeId are required.");
  }

  return ok({
    favorite: removeFavorite(parsed.data.userId, parsed.data.placeId),
  });
}
