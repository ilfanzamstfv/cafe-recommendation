"use client";

import { useState } from "react";
import { ListBox, Select } from "@heroui/react";
import { Bookmark, Check, ExternalLink, Heart, ThumbsDown } from "lucide-react";
import type { Cafe, RecommendedCafe } from "@/types/cafe";
import { CafePhoto, SkeletonRows, getMapUrl } from "@/features/dashboard/shared";
import type { HistoryEntry } from "@/features/dashboard/types";

type HistoryTabProps = {
  token: string;
  entries: HistoryEntry[] | null;
  cafes: RecommendedCafe[];
  favorites: Cafe[] | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
};

export function HistoryTab({ token, entries, cafes, favorites, loading, error, onRetry }: HistoryTabProps) {
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7days" | "30days">("all");
  const now = Date.now();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const filteredEntries = (entries ?? []).filter((entry) => {
    const createdAt = Date.parse(entry.createdAt);
    if (!Number.isFinite(createdAt)) return false;
    if (dateFilter === "today") return createdAt >= todayStart.getTime() && createdAt <= now;
    if (dateFilter === "7days") return createdAt >= now - 7 * 24 * 60 * 60 * 1000 && createdAt <= now;
    if (dateFilter === "30days") return createdAt >= now - 30 * 24 * 60 * 60 * 1000 && createdAt <= now;
    return true;
  });

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 border-b border-[#bcbd8b]/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold text-[#717744]">Your activity</p>
          <h1 className="m-0 text-3xl font-bold sm:text-4xl">Recent history</h1>
        </div>
        <div className="grid w-full gap-1.5 text-xs font-medium text-[#717744] sm:max-w-56">
          <Select aria-label="Filter activity by date" selectedKey={dateFilter} onSelectionChange={(key) => { if (key !== null) setDateFilter(String(key) as typeof dateFilter); }} className="w-full">
            <Select.Trigger className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-[#717744]/40 bg-white px-3 text-left text-sm font-medium text-[#373d20] shadow-none outline-none hover:border-[#373d20] focus-visible:ring-2 focus-visible:ring-[#bcbd8b]">
              <Select.Value />
              <Select.Indicator className="size-4 shrink-0 text-[#717744]" />
            </Select.Trigger>
            <Select.Popover className="z-50 min-w-44 rounded-md border border-[#717744]/30 bg-white p-1 text-sm text-[#373d20] shadow-md">
              <ListBox aria-label="Activity date ranges">
                <ListBox.Item id="all" className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">All dates</ListBox.Item>
                <ListBox.Item id="today" className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">Today</ListBox.Item>
                <ListBox.Item id="7days" className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">Last 7 days</ListBox.Item>
                <ListBox.Item id="30days" className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">Last 30 days</ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </div>
      {loading && <SkeletonRows kind="activity" />}
      {error && <p role="alert" className="py-8 text-sm text-[#3d0814]">{error} <button type="button" onClick={onRetry} className="font-semibold underline">Try again</button></p>}
      {!loading && !error && entries?.length === 0 && (
        <div className="border-y border-[#bcbd8b]/70 py-10">
          <h2 className="m-0 text-lg font-bold">No activity yet</h2>
          <p className="mb-0 mt-2 text-sm text-[#717744]">Likes, unlikes, saves, visits, and skipped cafes will appear here.</p>
        </div>
      )}
      {!loading && !error && (entries?.length ?? 0) > 0 && filteredEntries.length === 0 && (
        <div className="border-y border-[#bcbd8b]/70 py-10">
          <h2 className="m-0 text-lg font-bold">No activity in this date range</h2>
          <p className="mb-0 mt-2 text-sm text-[#717744]">Choose a wider date range to see more activity.</p>
        </div>
      )}
      <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
        {!loading && filteredEntries.map((entry) => {
          const label = { LIKE: "Liked a cafe", UNLIKE: "Unliked a cafe", SAVE: "Saved a cafe", VISITED: "Marked a visit", NOT_INTERESTED: "Skipped a cafe" }[entry.interactionType];
          const cafe = cafes.find((item) => item.placeId === entry.placeId) ?? favorites?.find((item) => item.placeId === entry.placeId);
          const cafeName = cafe?.name ?? "Cafe";
          const ActivityIcon = entry.interactionType === "VISITED" ? Check : entry.interactionType === "LIKE" || entry.interactionType === "UNLIKE" ? Heart : entry.interactionType === "SAVE" ? Bookmark : ThumbsDown;
          const mapUrl = cafe ? getMapUrl(cafe) : `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(entry.placeId)}`;

          return (
            <li key={entry.id} className="overflow-hidden rounded-lg border border-[#bcbd8b]/65 bg-white shadow-sm">
              <CafePhoto cafe={cafe ?? { name: cafeName, photoName: null }} token={token} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="m-0 min-w-0 flex-1 line-clamp-2 text-lg font-bold leading-snug text-[#373d20]">{cafeName}</h2>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#eff1ed] px-2.5 py-1.5 text-xs font-semibold text-[#717744]">
                    <ActivityIcon size={15} aria-hidden="true" /> {label}
                  </span>
                </div>
                <time dateTime={entry.createdAt} className="mt-2 block text-sm text-[#717744]">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.createdAt))}
                </time>
                <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[#717744]/35 text-sm font-semibold text-[#373d20] hover:bg-[#eff1ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744]">
                  Open in Maps <ExternalLink size={16} aria-hidden="true" />
                </a>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
