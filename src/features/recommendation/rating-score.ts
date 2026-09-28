export function getRatingScore(rating: number | null) {
  if (!rating) {
    return 0;
  }

  return Math.round((rating / 5) * 100);
}
