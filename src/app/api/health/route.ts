import { ok } from "@/lib/http/api-response";

export async function GET() {
  return ok({
    service: "cafe-recommendation-api",
    status: "healthy",
    mode: process.env.GOOGLE_PLACES_API_KEY ? "google_places" : "mock",
    timestamp: new Date().toISOString(),
  });
}
