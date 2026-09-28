export function getDistanceScore(distanceKm: number | undefined) {
  if (distanceKm === undefined) {
    return 0;
  }

  if (distanceKm <= 1) {
    return 100;
  }

  if (distanceKm <= 2) {
    return 90;
  }

  if (distanceKm <= 3) {
    return 80;
  }

  if (distanceKm <= 5) {
    return 60;
  }

  if (distanceKm <= 10) {
    return 30;
  }

  return 0;
}
