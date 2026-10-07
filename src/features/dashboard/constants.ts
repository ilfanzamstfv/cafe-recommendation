import type { PricePreference, Purpose } from "@/types/cafe";

export const priceLabels: Record<PricePreference, string> = {
  BUDGET: "Budget",
  MEDIUM: "Medium",
  PREMIUM: "Premium",
  ANY: "Any price",
};

export const purposeOptions: Array<{ value: Purpose; label: string }> = [
  { value: "WORK", label: "Work" },
  { value: "STUDY", label: "Study" },
  { value: "HANGOUT", label: "Hangout" },
  { value: "DATE", label: "Date" },
  { value: "MEETING", label: "Meeting" },
  { value: "QUICK_COFFEE", label: "Quick coffee" },
];
