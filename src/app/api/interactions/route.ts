import { addInteraction, listInteractions } from "@/features/user/demo-store";
import { fail, ok } from "@/lib/http/api-response";
import { interactionSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId") ?? "demo-user";

  return ok({
    userId,
    interactions: listInteractions(userId),
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = interactionSchema.safeParse(payload);

  if (!parsed.success) {
    return fail("INVALID_BODY", "Interaction payload is invalid.");
  }

  const interaction = addInteraction(parsed.data);

  return ok(
    {
      interaction,
    },
    { status: 201 },
  );
}
