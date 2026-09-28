import { getInteractionHistory } from "@/features/user/user-store";
import { fail, ok } from "@/lib/http/api-response";
import { isAuthFailure, requireAuth } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireAuth(request);

  if (isAuthFailure(auth)) {
    return auth;
  }

  try {
    return ok({
      userId: auth.user.id,
      history: await getInteractionHistory(auth),
    });
  } catch {
    return fail("HISTORY_UNAVAILABLE", "History is temporarily unavailable.", 502);
  }
}
