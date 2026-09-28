import { addInteraction, listInteractions } from "@/features/user/user-store";
import { fail, ok } from "@/lib/http/api-response";
import { isAuthFailure, requireAuth } from "@/lib/supabase/server";
import { interactionSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const auth = await requireAuth(request);

  if (isAuthFailure(auth)) {
    return auth;
  }

  try {
    return ok({
      userId: auth.user.id,
      interactions: await listInteractions(auth),
    });
  } catch {
    return fail("INTERACTIONS_UNAVAILABLE", "Interactions are temporarily unavailable.", 502);
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);

  if (isAuthFailure(auth)) {
    return auth;
  }

  const payload = await request.json().catch(() => null);
  const parsed = interactionSchema.safeParse(payload);

  if (!parsed.success) {
    return fail("INVALID_BODY", "Interaction payload is invalid.");
  }

  try {
    const interaction = await addInteraction(auth, parsed.data);

    return ok(
      {
        interaction,
      },
      { status: 201 },
    );
  } catch {
    return fail("INTERACTIONS_UNAVAILABLE", "Interaction could not be saved.", 502);
  }
}
