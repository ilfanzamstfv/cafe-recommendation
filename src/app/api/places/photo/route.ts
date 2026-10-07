import { z } from "zod";
import { fail } from "@/lib/http/api-response";
import { isAuthFailure, requireAuth } from "@/lib/supabase/server";

const photoNameSchema = z.string().regex(/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/);

export async function GET(request: Request) {
  const auth = await requireAuth(request);

  if (isAuthFailure(auth)) {
    return auth;
  }

  const photoName = new URL(request.url).searchParams.get("name");
  const parsed = photoNameSchema.safeParse(photoName);

  if (!parsed.success) {
    return fail("INVALID_QUERY", "A valid photo name is required.");
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return fail("PHOTO_UNAVAILABLE", "Cafe photo is temporarily unavailable.", 503);
  }

  try {
    const mediaUrl = new URL(`https://places.googleapis.com/v1/${parsed.data}/media`);
    mediaUrl.searchParams.set("maxWidthPx", "900");
    mediaUrl.searchParams.set("key", apiKey);

    const upstream = await fetch(mediaUrl, { cache: "no-store" });
    const contentType = upstream.headers.get("content-type") ?? "";

    if (!upstream.ok || !upstream.body || !contentType.toLowerCase().startsWith("image/")) {
      return fail("PHOTO_UNAVAILABLE", "Cafe photo is temporarily unavailable.", 502);
    }

    return new Response(upstream.body, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return fail("PHOTO_UNAVAILABLE", "Cafe photo is temporarily unavailable.", 502);
  }
}
