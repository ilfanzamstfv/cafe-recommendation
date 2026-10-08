"use client";

import { Compass } from "lucide-react";
import type { Cafe } from "@/types/cafe";
import { CafeCard, SkeletonRows } from "@/features/dashboard/shared";
import type { CafeDetail } from "@/features/dashboard/types";

type SavedTabProps = {
  token: string;
  cafes: Cafe[] | null;
  loading: boolean;
  error: string;
  savedIds: string[];
  likedIds: string[];
  busyPlaceId: string;
  detailsLoadingId: string;
  onRetry: () => void;
  onDiscover: () => void;
  onDetails: (cafe: CafeDetail) => void;
  onSave: (cafe: CafeDetail) => void;
  onLike: (cafe: CafeDetail) => void;
  onDismiss: (cafe: CafeDetail) => void;
};

export function SavedTab({
  token,
  cafes,
  loading,
  error,
  savedIds,
  likedIds,
  busyPlaceId,
  detailsLoadingId,
  onRetry,
  onDiscover,
  onDetails,
  onSave,
  onLike,
  onDismiss,
}: SavedTabProps) {
  return (
    <section>
      <div className="mb-6 border-b border-[#bcbd8b]/70 pb-5">
        <p className="mb-2 text-sm font-semibold text-[#717744]">Your collection</p>
        <h1 className="m-0 text-3xl font-bold sm:text-4xl">Saved cafes</h1>
      </div>
      {loading && <SkeletonRows kind="cafes" layout="grid" />}
      {error && <p role="alert" className="py-8 text-sm text-[#3d0814]">{error} <button type="button" onClick={onRetry} className="font-semibold underline">Try again</button></p>}
      {!loading && !error && cafes?.length === 0 && (
        <div className="border-y border-[#bcbd8b]/70 py-10">
          <h2 className="m-0 text-lg font-bold">Nothing saved yet</h2>
          <p className="mb-0 mt-2 text-sm text-[#717744]">Save a cafe from your recommendations and it will be here.</p>
          <button type="button" onClick={onDiscover} className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-[#373d20] underline underline-offset-4">Find cafes <Compass size={17} aria-hidden="true" /></button>
        </div>
      )}
      {!loading && cafes && cafes.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cafes.map((cafe) => (
            <CafeCard
              key={cafe.placeId}
              cafe={cafe}
              token={token}
              isSaved={savedIds.includes(cafe.placeId)}
              isLiked={likedIds.includes(cafe.placeId)}
              busy={busyPlaceId === cafe.placeId || detailsLoadingId === cafe.placeId}
              detailsLoading={detailsLoadingId === cafe.placeId}
              onDetails={() => onDetails(cafe)}
              onSave={() => onSave(cafe)}
              onLike={() => onLike(cafe)}
              onDismiss={() => onDismiss(cafe)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
