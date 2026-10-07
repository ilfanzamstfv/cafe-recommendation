"use client";

import Image from "next/image";
import { Bookmark, Coffee, ExternalLink, Heart, Star, ThumbsDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Cafe, PricePreference } from "@/types/cafe";
import { priceLabels } from "./constants";
import type { CafeDetail } from "./types";

export function formatDistance(distanceKm?: number) {
  return distanceKm === undefined ? null : `${distanceKm.toFixed(1)} km`;
}

export function formatPrice(priceLevel: PricePreference | null) {
  return priceLevel ? priceLabels[priceLevel] : "Price unavailable";
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en", { notation: value > 999 ? "compact" : "standard" }).format(value);
}

export function getMapUrl(cafe: Cafe) {
  return cafe.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(cafe.placeId)}`;
}

export function CafePhoto({
  cafe,
  token,
}: {
  cafe: Pick<Cafe, "name" | "photoName" | "photoAttributions">;
  token: string;
}) {
  const photoRef = useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = useState("");

  useEffect(() => {
    const photoName = cafe.photoName;
    const element = photoRef.current;
    if (!photoName || !element) return;

    const controller = new AbortController();
    let objectUrl = "";
    const loadPhoto = async () => {
      try {
        const query = new URLSearchParams({ name: photoName });
        const response = await fetch(`/api/places/photo?${query}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok) return;
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      } catch {
        // Keep the neutral fallback visible when a photo cannot be loaded.
      }
    };

    if (!("IntersectionObserver" in window)) {
      void loadPhoto();
      return () => {
        controller.abort();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        observer.disconnect();
        void loadPhoto();
      }
    }, { rootMargin: "200px" });
    observer.observe(element);

    return () => {
      observer.disconnect();
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [cafe.photoName, token]);

  return (
    <figure className="m-0">
      <div ref={photoRef} className="relative aspect-[4/3] overflow-hidden bg-[#bcbd8b]/35">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`Cafe: ${cafe.name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            unoptimized
            onError={() => setImageSrc("")}
            className="object-cover"
          />
        ) : (
          <div role="img" className="grid size-full place-items-center text-[#717744]" aria-label={`No photo available for ${cafe.name}`}>
            <Coffee size={34} strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
      </div>
      {!!cafe.photoAttributions?.length && (
        <figcaption className="flex flex-wrap gap-x-1 border-b border-[#bcbd8b]/55 px-3 py-1.5 text-[11px] leading-4 text-[#717744]">
          <span>Photo:</span>
          {cafe.photoAttributions.map((attribution, index) => (
            <span key={`${attribution.displayName}-${index}`}>
              {index > 0 ? ", " : ""}
              {attribution.uri?.startsWith("https://") ? (
                <a href={attribution.uri} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  {attribution.displayName}
                </a>
              ) : attribution.displayName}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}

export function CafeCard({
  cafe,
  token,
  isSaved,
  isLiked,
  busy,
  detailsLoading,
  onDetails,
  onSave,
  onLike,
  onDismiss,
}: {
  cafe: CafeDetail;
  token: string;
  isSaved: boolean;
  isLiked: boolean;
  busy: boolean;
  detailsLoading: boolean;
  onDetails: () => void;
  onSave: () => void;
  onLike: () => void;
  onDismiss: () => void;
}) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-[#bcbd8b]/65 bg-white shadow-sm">
      <div className="relative">
        <CafePhoto cafe={cafe} token={token} />
        {cafe.recommendationScore !== undefined && (
          <span className="absolute left-3 top-3 rounded-md bg-[#3d0814] px-3 py-1.5 text-xs font-bold text-white">
            {cafe.recommendationScore}% match
          </span>
        )}
        <button
          type="button"
          title={isSaved ? "Remove from saved" : "Save cafe"}
          aria-label={isSaved ? `Remove ${cafe.name} from saved` : `Save ${cafe.name}`}
          aria-pressed={isSaved}
          onClick={onSave}
          disabled={busy}
          className={`absolute right-3 top-3 grid size-11 place-items-center rounded-full border border-white/70 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2 disabled:opacity-60 ${isSaved ? "bg-[#3d0814] text-white" : "bg-white/95 text-[#373d20] hover:bg-white"}`}
        >
          <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="m-0 line-clamp-2 text-lg font-bold leading-snug text-[#373d20]">{cafe.name}</h3>
          <span className={`shrink-0 pt-1 text-xs font-semibold ${cafe.isOpenNow === true ? "text-[#373d20]" : "text-[#717744]"}`}>
            {cafe.isOpenNow === true ? "Open now" : cafe.isOpenNow === false ? "Closed" : "Hours n/a"}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#717744]">
          {cafe.rating !== null && (
            <span className="inline-flex items-center gap-1 font-semibold text-[#373d20]">
              <Star size={15} fill="currentColor" aria-hidden="true" />
              {cafe.rating.toFixed(1)}
              <span className="font-normal text-[#717744]">({formatCount(cafe.userRatingCount)})</span>
            </span>
          )}
          {formatDistance(cafe.distanceKm) && <span>{formatDistance(cafe.distanceKm)} away</span>}
          <span>{formatPrice(cafe.priceLevel)}</span>
        </div>
        {cafe.reasons && cafe.reasons.length > 0 && (
          <p className="mb-0 mt-3 line-clamp-2 text-sm leading-5 text-[#717744]">{cafe.reasons.slice(0, 2).join(" / ")}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <button
            type="button"
            onClick={onDetails}
            disabled={busy}
            className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-md bg-[#373d20] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#4a5230] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {detailsLoading && <span className="size-4 shrink-0 rounded-sm bg-white/35" aria-hidden="true" />}
            <span className="truncate">{detailsLoading ? "Loading..." : "View details"}</span>
          </button>
          <button
            type="button"
            title="Like cafe"
            aria-label={`Like ${cafe.name}`}
            aria-pressed={isLiked}
            onClick={onLike}
            disabled={busy || isLiked}
            className={`grid size-11 shrink-0 place-items-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2 disabled:opacity-60 ${isLiked ? "border-[#717744] bg-[#bcbd8b]/50 text-[#373d20]" : "border-[#717744]/40 bg-white text-[#373d20] hover:bg-[#bcbd8b]/30"}`}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} aria-hidden="true" />
          </button>
          <button
            type="button"
            title="Not interested"
            aria-label={`Not interested in ${cafe.name}`}
            onClick={onDismiss}
            disabled={busy}
            className="grid size-11 shrink-0 place-items-center rounded-md border border-[#717744]/40 bg-white text-[#717744] transition-colors hover:bg-[#eff1ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <ThumbsDown size={18} aria-hidden="true" />
          </button>
          <a
            href={getMapUrl(cafe)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${cafe.name} in Google Maps`}
            className="grid size-11 shrink-0 place-items-center rounded-md text-[#717744] transition-colors hover:bg-[#eff1ed] hover:text-[#373d20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2"
          >
            <ExternalLink size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

export function SkeletonRows({ kind, layout = "list" }: { kind: "cafes" | "activity" | "form"; layout?: "list" | "grid" }) {
  if (kind === "form") {
    return (
      <div role="status" aria-label="Loading preferences" className="max-w-2xl space-y-6">
        {[0, 1, 2, 3].map((item) => <div key={item} className="space-y-2"><div className="h-4 w-32 bg-[#bcbd8b]/45" /><div className="h-12 w-full rounded-md bg-[#bcbd8b]/25" /></div>)}
        <span className="sr-only">Loading preferences</span>
      </div>
    );
  }

  const grid = kind === "activity" || layout === "grid";
  return (
    <div role="status" aria-label={kind === "activity" ? "Loading activity" : "Loading cafes"} className={grid ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" : "grid grid-cols-1 gap-4"}>
      {[0, 1, 2].map((item) => (
        <div key={item} className="overflow-hidden rounded-lg border border-[#bcbd8b]/55 bg-white">
          <div className="aspect-[4/3] animate-pulse bg-[#bcbd8b]/35" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-2/3 animate-pulse bg-[#bcbd8b]/45" />
            <div className="h-4 w-1/2 animate-pulse bg-[#bcbd8b]/30" />
            <div className="h-11 w-full animate-pulse rounded-md bg-[#bcbd8b]/30" />
          </div>
        </div>
      ))}
      <span className="sr-only">{kind === "activity" ? "Loading activity" : "Loading cafes"}</span>
    </div>
  );
}
