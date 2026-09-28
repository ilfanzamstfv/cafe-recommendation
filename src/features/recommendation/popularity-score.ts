export function getPopularityScore(reviewCount: number) {
  if (reviewCount <= 50) {
    return 20;
  }

  if (reviewCount <= 100) {
    return 40;
  }

  if (reviewCount <= 500) {
    return 60;
  }

  if (reviewCount <= 1000) {
    return 80;
  }

  return 100;
}
