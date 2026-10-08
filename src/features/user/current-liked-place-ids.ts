type LikeInteraction = {
  placeId: string;
  interactionType: string;
};

export function getCurrentLikedPlaceIds(interactions: LikeInteraction[]) {
  const statusByPlace = new Map<string, boolean>();

  // The caller supplies newest-first rows, so the first like event per cafe is current.
  for (const interaction of interactions) {
    if (statusByPlace.has(interaction.placeId)) continue;
    if (interaction.interactionType === "LIKE") statusByPlace.set(interaction.placeId, true);
    if (interaction.interactionType === "UNLIKE") statusByPlace.set(interaction.placeId, false);
  }

  return [...statusByPlace].filter(([, liked]) => liked).map(([placeId]) => placeId);
}
