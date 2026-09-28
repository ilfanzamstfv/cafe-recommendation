import type { InteractionType, UserPreference } from "@/types/cafe";

type UserInteraction = {
  id: string;
  userId: string;
  placeId: string;
  interactionType: InteractionType;
  createdAt: string;
};

const preferences = new Map<string, UserPreference>();
const interactions: UserInteraction[] = [];
const favorites = new Map<string, Set<string>>();

export function getDefaultPreference(userId = "demo-user"): UserPreference {
  return {
    userId,
    maxDistanceKm: 5,
    minimumRating: 4.2,
    preferredPrice: "MEDIUM",
    purposes: ["WORK", "HANGOUT"],
    updatedAt: new Date().toISOString(),
  };
}

export function getPreference(userId = "demo-user") {
  return preferences.get(userId) ?? getDefaultPreference(userId);
}

export function savePreference(preference: Omit<UserPreference, "updatedAt">) {
  const nextPreference = {
    ...preference,
    updatedAt: new Date().toISOString(),
  };

  preferences.set(preference.userId, nextPreference);

  return nextPreference;
}

export function addInteraction(input: Omit<UserInteraction, "id" | "createdAt">) {
  const interaction = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  interactions.unshift(interaction);

  if (input.interactionType === "SAVE") {
    saveFavorite(input.userId, input.placeId);
  }

  return interaction;
}

export function listInteractions(userId = "demo-user") {
  return interactions.filter((interaction) => interaction.userId === userId);
}

export function listFavorites(userId = "demo-user") {
  return Array.from(favorites.get(userId) ?? []);
}

export function saveFavorite(userId: string, placeId: string) {
  const current = favorites.get(userId) ?? new Set<string>();

  current.add(placeId);
  favorites.set(userId, current);

  return {
    userId,
    placeId,
    saved: true,
  };
}

export function removeFavorite(userId: string, placeId: string) {
  const current = favorites.get(userId) ?? new Set<string>();

  current.delete(placeId);
  favorites.set(userId, current);

  return {
    userId,
    placeId,
    saved: false,
  };
}
