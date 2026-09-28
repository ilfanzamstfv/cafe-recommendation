import type { PricePreference } from "@/types/cafe";

const priceOrder: Exclude<PricePreference, "ANY">[] = ["BUDGET", "MEDIUM", "PREMIUM"];

export function getPriceScore(cafePrice: PricePreference | null, userPrice: PricePreference) {
  if (userPrice === "ANY") {
    return 100;
  }

  if (!cafePrice) {
    return 50;
  }

  if (cafePrice === userPrice) {
    return 100;
  }

  const cafeIndex = priceOrder.indexOf(cafePrice);
  const userIndex = priceOrder.indexOf(userPrice);

  return Math.abs(cafeIndex - userIndex) === 1 ? 70 : 30;
}
