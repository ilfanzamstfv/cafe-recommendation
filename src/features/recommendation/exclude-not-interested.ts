export function excludeNotInterestedCafes<T extends { placeId: string }>(
  cafes: T[],
  excludedPlaceIds: string[],
) {
  const excluded = new Set(excludedPlaceIds);
  return cafes.filter((cafe) => !excluded.has(cafe.placeId));
}
