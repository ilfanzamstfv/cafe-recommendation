import type {
  InteractionType,
  Purpose,
  UserInteractionSignal,
  UserPreference,
} from "@/types/cafe";
import type { AuthContext } from "@/lib/supabase/server";

type PreferenceRow = {
  max_distance_km: number;
  minimum_rating: number;
  preferred_price: UserPreference["preferredPrice"];
  updated_at: string;
};

type PurposeRow = {
  purpose: Purpose;
};

type InteractionRow = {
  id: string;
  user_id: string;
  place_id: string;
  interaction_type: InteractionType;
  created_at: string;
};

type FavoriteRow = {
  place_id: string;
};

export type PreferenceInput = {
  maxDistanceKm: number;
  minimumRating: number;
  preferredPrice: UserPreference["preferredPrice"];
  purposes: Purpose[];
};

export type UserInteraction = {
  id: string;
  userId: string;
  placeId: string;
  interactionType: InteractionType;
  createdAt: string;
};

function mapInteraction(row: InteractionRow): UserInteraction {
  return {
    id: row.id,
    userId: row.user_id,
    placeId: row.place_id,
    interactionType: row.interaction_type,
    createdAt: row.created_at,
  };
}

export function getDefaultPreference(userId: string): UserPreference {
  return {
    userId,
    maxDistanceKm: 5,
    minimumRating: 4.2,
    preferredPrice: "MEDIUM",
    purposes: ["WORK", "HANGOUT"],
    updatedAt: new Date().toISOString(),
  };
}

export async function getPreference(auth: AuthContext): Promise<UserPreference> {
  const { data: preference, error: preferenceError } = await auth.supabase
    .from("user_preferences")
    .select("max_distance_km, minimum_rating, preferred_price, updated_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (preferenceError) {
    throw preferenceError;
  }

  const { data: purposes, error: purposesError } = await auth.supabase
    .from("user_purposes")
    .select("purpose")
    .eq("user_id", auth.user.id)
    .returns<PurposeRow[]>();

  if (purposesError) {
    throw purposesError;
  }

  const preferenceRow = preference as PreferenceRow | null;

  if (!preferenceRow) {
    return getDefaultPreference(auth.user.id);
  }

  return {
    userId: auth.user.id,
    maxDistanceKm: preferenceRow.max_distance_km,
    minimumRating: preferenceRow.minimum_rating,
    preferredPrice: preferenceRow.preferred_price,
    purposes: (purposes ?? []).map((row) => row.purpose),
    updatedAt: preferenceRow.updated_at,
  };
}

export async function savePreference(auth: AuthContext, input: PreferenceInput) {
  const updatedAt = new Date().toISOString();
  const purposes = Array.from(new Set(input.purposes));
  const { error: preferenceError } = await auth.supabase.from("user_preferences").upsert(
    {
      user_id: auth.user.id,
      max_distance_km: input.maxDistanceKm,
      minimum_rating: input.minimumRating,
      preferred_price: input.preferredPrice,
      updated_at: updatedAt,
    },
    {
      onConflict: "user_id",
    },
  );

  if (preferenceError) {
    throw preferenceError;
  }

  const { error: deleteError } = await auth.supabase
    .from("user_purposes")
    .delete()
    .eq("user_id", auth.user.id);

  if (deleteError) {
    throw deleteError;
  }

  if (purposes.length > 0) {
    const { error: insertError } = await auth.supabase.from("user_purposes").insert(
      purposes.map((purpose) => ({
        user_id: auth.user.id,
        purpose,
      })),
    );

    if (insertError) {
      throw insertError;
    }
  }

  return {
    userId: auth.user.id,
    ...input,
    purposes,
    updatedAt,
  };
}

export async function listInteractions(auth: AuthContext) {
  const { data, error } = await auth.supabase
    .from("user_cafe_interactions")
    .select("id, user_id, place_id, interaction_type, created_at")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .returns<InteractionRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapInteraction);
}

export async function addInteraction(
  auth: AuthContext,
  input: {
    placeId: string;
    interactionType: InteractionType;
  },
) {
  const { data, error } = await auth.supabase
    .from("user_cafe_interactions")
    .insert({
      user_id: auth.user.id,
      place_id: input.placeId,
      interaction_type: input.interactionType,
    })
    .select("id, user_id, place_id, interaction_type, created_at")
    .single();

  if (error) {
    throw error;
  }

  if (input.interactionType === "SAVE") {
    await saveFavorite(auth, input.placeId);
  }

  return mapInteraction(data as InteractionRow);
}

export async function getInteractionSignal(auth: AuthContext): Promise<UserInteractionSignal> {
  const interactions = await listInteractions(auth);

  return {
    likedPlaceIds: interactions
      .filter((interaction) => interaction.interactionType === "LIKE")
      .map((interaction) => interaction.placeId),
    savedPlaceIds: interactions
      .filter((interaction) => interaction.interactionType === "SAVE")
      .map((interaction) => interaction.placeId),
    visitedPlaceIds: interactions
      .filter((interaction) => interaction.interactionType === "VISITED")
      .map((interaction) => interaction.placeId),
    notInterestedPlaceIds: interactions
      .filter((interaction) => interaction.interactionType === "NOT_INTERESTED")
      .map((interaction) => interaction.placeId),
  };
}

export async function getInteractionHistory(auth: AuthContext) {
  const interactions = await listInteractions(auth);

  return {
    liked: interactions.filter((interaction) => interaction.interactionType === "LIKE"),
    saved: interactions.filter((interaction) => interaction.interactionType === "SAVE"),
    visited: interactions.filter((interaction) => interaction.interactionType === "VISITED"),
    notInterested: interactions.filter(
      (interaction) => interaction.interactionType === "NOT_INTERESTED",
    ),
  };
}

export async function listFavorites(auth: AuthContext) {
  const { data, error } = await auth.supabase
    .from("favorites")
    .select("place_id")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .returns<FavoriteRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((favorite) => favorite.place_id);
}

export async function saveFavorite(auth: AuthContext, placeId: string) {
  const { error } = await auth.supabase.from("favorites").upsert(
    {
      user_id: auth.user.id,
      place_id: placeId,
    },
    {
      onConflict: "user_id,place_id",
    },
  );

  if (error) {
    throw error;
  }

  return {
    userId: auth.user.id,
    placeId,
    saved: true,
  };
}

export async function removeFavorite(auth: AuthContext, placeId: string) {
  const { error } = await auth.supabase
    .from("favorites")
    .delete()
    .eq("user_id", auth.user.id)
    .eq("place_id", placeId);

  if (error) {
    throw error;
  }

  return {
    userId: auth.user.id,
    placeId,
    saved: false,
  };
}
