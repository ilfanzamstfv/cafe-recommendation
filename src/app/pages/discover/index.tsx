"use client";

import dynamic from "next/dynamic";
import { Coffee, LocateFixed, Map, MapPin, Navigation, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, type FormEventHandler } from "react";
import type { Coordinates, RecommendedCafe, UserPreference } from "@/types/cafe";
import { priceLabels } from "@/features/dashboard/constants";
import { CafeCard, SkeletonRows } from "@/features/dashboard/shared";
import type { CafeDetail } from "@/features/dashboard/types";

const CafeMap = dynamic(() => import("@/app/cafe-map"), {
  ssr: false,
  loading: () => <div className="h-full min-h-[300px] bg-[#e4e7df]" aria-label="Loading map" />,
});

type DiscoverTabProps = {
  token: string;
  coordinates: Coordinates | null;
  latitudeInput: string;
  longitudeInput: string;
  locationBusy: boolean;
  locationError: string;
  locationMessage: string;
  radius: number;
  cafes: RecommendedCafe[];
  source: "google_places" | "mock" | "";
  searchLoading: boolean;
  searchError: string;
  savedIds: string[];
  likedIds: string[];
  busyPlaceId: string;
  detailsLoadingId: string;
  preference: UserPreference | null;
  mobileView: "list" | "map";
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onRadiusChange: (value: number) => void;
  onMobileViewChange: (view: "list" | "map") => void;
  onUseCurrentLocation: () => void;
  onManualLocationSubmit: FormEventHandler<HTMLFormElement>;
  onRetrySearch: () => void;
  onOpenDetails: (cafe: CafeDetail) => void;
  onSave: (cafe: CafeDetail) => void;
  onLike: (cafe: CafeDetail) => void;
  onDismiss: (cafe: CafeDetail) => void;
};

export function DiscoverTab({
  token,
  coordinates,
  latitudeInput,
  longitudeInput,
  locationBusy,
  locationError,
  locationMessage,
  radius,
  cafes,
  source,
  searchLoading,
  searchError,
  savedIds,
  likedIds,
  busyPlaceId,
  detailsLoadingId,
  preference,
  mobileView,
  onLatitudeChange,
  onLongitudeChange,
  onRadiusChange,
  onMobileViewChange,
  onUseCurrentLocation,
  onManualLocationSubmit,
  onRetrySearch,
  onOpenDetails,
  onSave,
  onLike,
  onDismiss,
}: DiscoverTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const isListView = mobileView === "list";

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(searchQuery.trim().toLocaleLowerCase()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  const filteredCafes = cafes.filter((cafe) => cafe.name.toLocaleLowerCase().includes(debouncedQuery));

  return (
    <>
      <section className="mb-6 flex flex-col justify-between gap-5 sm:mb-8 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#717744]">
            <MapPin size={16} aria-hidden="true" />
            {coordinates ? `${coordinates.latitude.toFixed(3)}, ${coordinates.longitude.toFixed(3)}` : "Choose a location to start"}
          </p>
          <h1 className="m-0 text-[2rem] font-bold leading-tight tracking-normal sm:text-4xl">Find a cafe for today</h1>
        </div>
        <button type="button" onClick={onUseCurrentLocation} disabled={locationBusy} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md bg-[#373d20] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#4a5230] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70">
          {locationBusy ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : <LocateFixed size={18} aria-hidden="true" />}
          {locationBusy ? "Getting location" : coordinates ? "Refresh location" : "Use my location"}
        </button>
      </section>

      <section className="mb-7 border-y border-[#bcbd8b]/70 py-4" aria-label="Search controls">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid flex-1 gap-1.5 text-xs font-semibold text-[#717744] sm:max-w-[240px]">
            Search radius
            <select value={radius} onChange={(event) => onRadiusChange(Number(event.target.value))} className="min-h-12 w-full rounded-md border border-[#717744]/40 bg-white px-3 text-sm font-medium text-[#373d20] outline-none focus:border-[#373d20] focus:ring-2 focus:ring-[#bcbd8b]">
              <option value={1000}>Within 1 km</option>
              <option value={3000}>Within 3 km</option>
              <option value={5000}>Within 5 km</option>
              <option value={10000}>Within 10 km</option>
            </select>
          </label>
          <label className="grid min-w-0 flex-1 gap-1.5 text-xs font-semibold text-[#717744]">
            Search cafes
            <span className="relative block">
              <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#717744]" />
              <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by cafe name" className="min-h-12 w-full rounded-md border border-[#717744]/40 bg-white pl-10 pr-3 text-sm font-normal text-[#373d20] outline-none placeholder:text-[#717744]/70 focus:border-[#373d20] focus:ring-2 focus:ring-[#bcbd8b]" />
            </span>
          </label>
          <div className="hidden h-12 items-center border-l border-[#bcbd8b] pl-4 text-sm text-[#717744] lg:flex">
            <SlidersHorizontal size={17} className="mr-2" aria-hidden="true" />
            {preference ? `${preference.minimumRating.toFixed(1)}+ rating · ${priceLabels[preference.preferredPrice]}` : "Personalized for you"}
          </div>
        </div>

        <details className="mt-4">
          <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[#717744] hover:text-[#373d20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744]">
            <Navigation size={16} aria-hidden="true" /> Enter coordinates manually
          </summary>
          <form onSubmit={onManualLocationSubmit} className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <label className="grid gap-1.5 text-xs font-semibold text-[#717744]">
              Latitude
              <input required type="number" inputMode="decimal" step="any" min="-90" max="90" value={latitudeInput} onChange={(event) => onLatitudeChange(event.target.value)} placeholder="-6.20" className="min-h-12 w-full rounded-md border border-[#717744]/40 bg-white px-3 text-sm font-normal text-[#373d20] outline-none focus:border-[#373d20] focus:ring-2 focus:ring-[#bcbd8b]" />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#717744]">
              Longitude
              <input required type="number" inputMode="decimal" step="any" min="-180" max="180" value={longitudeInput} onChange={(event) => onLongitudeChange(event.target.value)} placeholder="106.82" className="min-h-12 w-full rounded-md border border-[#717744]/40 bg-white px-3 text-sm font-normal text-[#373d20] outline-none focus:border-[#373d20] focus:ring-2 focus:ring-[#bcbd8b]" />
            </label>
            <button type="submit" disabled={searchLoading} className="min-h-12 rounded-md border border-[#717744]/40 px-5 text-sm font-semibold hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] disabled:opacity-60">Use coordinates</button>
          </form>
        </details>
        {locationError && <p role="alert" className="mb-0 mt-3 text-sm text-[#3d0814]">{locationError}</p>}
        {locationMessage && <p role="status" className="mb-0 mt-3 text-sm text-[#717744]">{locationMessage}</p>}
      </section>

      <div className="mb-4 flex min-h-11 items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg font-bold">Recommended cafes</h2>
          <p className="mb-0 mt-1 text-sm text-[#717744]">
            {coordinates ? `${filteredCafes.length}${debouncedQuery ? " matching" : ""} places${source === "mock" ? " · sample data" : ""}` : "Based on your location and preferences"}
          </p>
        </div>
        <div className="flex rounded-md border border-[#717744]/35 bg-white p-1 lg:hidden" role="group" aria-label="Choose list or map view">
          <button type="button" onClick={() => onMobileViewChange("list")} aria-pressed={isListView} className={`inline-flex min-h-10 items-center gap-1.5 rounded px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] ${isListView ? "bg-[#373d20] text-white" : "text-[#717744]"}`}><Coffee size={16} aria-hidden="true" />List</button>
          <button type="button" onClick={() => onMobileViewChange("map")} aria-pressed={!isListView} className={`inline-flex min-h-10 items-center gap-1.5 rounded px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] ${!isListView ? "bg-[#373d20] text-white" : "text-[#717744]"}`}><Map size={16} aria-hidden="true" />Map</button>
        </div>
      </div>

      {searchError && <div role="alert" className="mb-5 flex items-center justify-between gap-3 border border-[#3d0814]/20 bg-white px-4 py-3 text-sm text-[#3d0814]"><span>{searchError}</span><button type="button" onClick={onRetrySearch} className="min-h-10 shrink-0 rounded px-3 font-semibold underline underline-offset-2">Try again</button></div>}

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-9">
        <section className={`${isListView ? "block" : "hidden"} min-w-0`} aria-label="Recommended cafe list" aria-busy={searchLoading}>
          {searchLoading && <SkeletonRows kind="cafes" />}
          {!coordinates && !searchLoading && (
            <div className="border-y border-[#bcbd8b]/70 py-10 text-center sm:py-14">
              <MapPin size={26} className="mx-auto text-[#717744]" aria-hidden="true" />
              <h3 className="mb-0 mt-3 text-lg font-bold">Start with your location</h3>
              <p className="mx-auto mb-0 mt-2 max-w-sm text-sm leading-6 text-[#717744]">Use your current location or enter coordinates to see cafes around you.</p>
            </div>
          )}
          {coordinates && !searchLoading && cafes.length === 0 && !searchError && (
            <div className="border-y border-[#bcbd8b]/70 py-10 text-center sm:py-14">
              <Coffee size={26} className="mx-auto text-[#717744]" aria-hidden="true" />
              <h3 className="mb-0 mt-3 text-lg font-bold">No cafes in this radius</h3>
              <p className="mx-auto mb-0 mt-2 max-w-sm text-sm leading-6 text-[#717744]">Increase the search radius and search again.</p>
            </div>
          )}
          {coordinates && !searchLoading && cafes.length > 0 && filteredCafes.length === 0 && (
            <div className="border-y border-[#bcbd8b]/70 py-10 text-center sm:py-14">
              <Search size={26} className="mx-auto text-[#717744]" aria-hidden="true" />
              <h3 className="mb-0 mt-3 text-lg font-bold">No matching cafes</h3>
              <p className="mx-auto mb-0 mt-2 max-w-sm text-sm leading-6 text-[#717744]">Try a different cafe name or clear the search field.</p>
            </div>
          )}
          {!searchLoading && (
            <div className="grid grid-cols-1 gap-4">
              {filteredCafes.map((cafe) => (
                <CafeCard
                  key={cafe.placeId}
                  cafe={cafe}
                  token={token}
                  isSaved={savedIds.includes(cafe.placeId)}
                  isLiked={likedIds.includes(cafe.placeId)}
                  busy={busyPlaceId === cafe.placeId || detailsLoadingId === cafe.placeId}
                  detailsLoading={detailsLoadingId === cafe.placeId}
                  onDetails={() => onOpenDetails(cafe)}
                  onSave={() => onSave(cafe)}
                  onLike={() => onLike(cafe)}
                  onDismiss={() => onDismiss(cafe)}
                />
              ))}
            </div>
          )}
        </section>
        <section className={`${mobileView === "map" ? "block" : "hidden"} overflow-hidden rounded-lg border border-[#717744]/25 lg:sticky lg:top-5 lg:block`} aria-label="Map of recommended cafes">
          {coordinates ? (
            <div className="h-[55dvh] min-h-[320px] max-h-[660px] lg:h-[calc(100dvh-150px)] lg:min-h-[480px]">
              <CafeMap center={coordinates} cafes={filteredCafes} onSelect={onOpenDetails} />
            </div>
          ) : (
            <div className="grid min-h-[320px] place-items-center bg-[#e4e7df] p-6 text-center lg:min-h-[480px]">
              <div><MapPin size={24} className="mx-auto text-[#717744]" aria-hidden="true" /><p className="mb-0 mt-3 text-sm font-semibold">Map appears after you choose a location</p></div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
