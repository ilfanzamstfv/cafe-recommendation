import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { fail } from "@/lib/http/api-response";

export type AuthContext = {
  user: User;
  accessToken: string;
  supabase: ReturnType<typeof createAuthedSupabaseClient>;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export function createAuthedSupabaseClient(accessToken: string) {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function readBearerToken(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();

  return token.length > 0 ? token : null;
}

export async function requireAuth(request: Request): Promise<AuthContext | Response> {
  const accessToken = readBearerToken(request);

  if (!accessToken) {
    return fail("UNAUTHORIZED", "Authentication is required.", 401);
  }

  try {
    const supabase = createAuthedSupabaseClient(accessToken);
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      return fail("UNAUTHORIZED", "Authentication is invalid or expired.", 401);
    }

    return {
      user: data.user,
      accessToken,
      supabase,
    };
  } catch {
    return fail("AUTH_UNAVAILABLE", "Authentication service is temporarily unavailable.", 503);
  }
}

export function isAuthFailure(value: AuthContext | Response): value is Response {
  return value instanceof Response;
}
