import { getPreference, savePreference } from "@/features/user/user-store";
import { fail, ok } from "@/lib/http/api-response";
import { isAuthFailure, requireAuth } from "@/lib/supabase/server";
import { preferenceSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const auth = await requireAuth(request);

  if (isAuthFailure(auth)) {
    return auth;
  }

  try {
    return ok({
      preference: await getPreference(auth),
    });
  } catch {
    return fail("PREFERENCES_UNAVAILABLE", "Preferences are temporarily unavailable.", 502);
  }
}

export async function PUT(request: Request) {
  const auth = await requireAuth(request);

  if (isAuthFailure(auth)) {
    return auth;
  }

  const payload = await request.json().catch(() => null);
  const parsed = preferenceSchema.safeParse(payload);

  if (!parsed.success) {
    return fail("INVALID_BODY", "Preference payload is invalid.");
  }

  try {
    const preference = await savePreference(auth, parsed.data);

    return ok({
      preference,
    });
  } catch {
    return fail("PREFERENCES_UNAVAILABLE", "Preferences could not be saved.", 502);
  }
}
