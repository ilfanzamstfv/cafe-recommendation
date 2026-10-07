export type PricePreference = "BUDGET" | "MEDIUM" | "PREMIUM" | "ANY";

export type Purpose =
  | "WORK"
  | "STUDY"
  | "HANGOUT"
  | "DATE"
  | "MEETING"
  | "QUICK_COFFEE";

export type InteractionType = "LIKE" | "SAVE" | "VISITED" | "NOT_INTERESTED";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type PhotoAttribution = {
  displayName: string;
  uri?: string;
};

export type UserPreference = {
  userId: string;
  maxDistanceKm: number;
  minimumRating: number;
  preferredPrice: PricePreference;
  purposes: Purpose[];
  updatedAt: string;
};

export type Cafe = {
  placeId: string;
  name: string;
  location: Coordinates;
  rating: number | null;
  userRatingCount: number;
  priceLevel: PricePreference | null;
  isOpenNow: boolean | null;
  primaryType: string | null;
  photoName: string | null;
  photoAttributions?: PhotoAttribution[];
  googleMapsUri: string | null;
  distanceKm?: number;
};

export type UserInteractionSignal = {
  likedPlaceIds: string[];
  savedPlaceIds: string[];
  visitedPlaceIds: string[];
  notInterestedPlaceIds: string[];
};

export type RecommendationBreakdown = {
  rating: number;
  distance: number;
  preference: number;
  popularity: number;
  price: number;
  openStatus: number;
  interaction: number;
};

export type RecommendedCafe = Cafe & {
  recommendationScore: number;
  scoreBreakdown: RecommendationBreakdown;
  reasons: string[];
};
