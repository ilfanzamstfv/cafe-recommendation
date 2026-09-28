import { getPreference, savePreference } from "@/features/user/demo-store";
import { fail, ok } from "@/lib/http/api-response";
import { preferenceSchema, searchParamsToObject } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? "demo-user";

  return ok({
    preference: getPreference(userId),
  });
}

export async function PUT(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = preferenceSchema.safeParse(payload);

  if (!parsed.success) {
    return fail("INVALID_BODY", "Preference payload is invalid.");
  }

  const preference = savePreference(parsed.data);

  return ok({
    preference,
  });
}
