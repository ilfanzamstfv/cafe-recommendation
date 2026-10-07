import type { Cafe, InteractionType, RecommendedCafe } from "@/types/cafe";

export type Tab = "discover" | "favorites" | "history" | "profile";
export type CafeDetail = Cafe & Partial<RecommendedCafe>;
export type HistoryEntry = {
  id: string;
  placeId: string;
  interactionType: InteractionType;
  createdAt: string;
};
