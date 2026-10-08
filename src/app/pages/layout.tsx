"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ProtectedHome } from "../protected-home";
import type { Tab } from "@/features/dashboard/types";

const routeTabs = {
  "/pages/discover": "discover",
  "/pages/saved": "favorites",
  "/pages/history": "history",
  "/pages/profile": "profile",
} satisfies Record<string, Tab>;

export default function PagesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeTab = routeTabs[pathname as keyof typeof routeTabs] ?? "discover";

  return (
    <>
      <ProtectedHome activeTab={activeTab} />
      {children}
    </>
  );
}
