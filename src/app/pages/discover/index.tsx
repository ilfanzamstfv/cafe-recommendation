"use client";

import dynamic from "next/dynamic";
import { Coffee, Map, MapPin, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { ListBox, Select } from "@heroui/react";
import { useEffect, useState } from "react";
import type { FormEventHandler } from "react";
import type { Coordinates, PricePreference, Purpose, RecommendedCafe, UserPreference } from "@/types/cafe";
import { priceLabels, purposeOptions } from "@/features/dashboard/constants";
import { CafeCard, SkeletonRows } from "@/features/dashboard/shared";
import type { CafeDetail } from "@/features/dashboard/types";

const CafeMap = dynamic(() => import("@/app/cafe-map"), {
  ssr: false,
  loading: () => <div className="h-full min-h-[300px] bg-[#e4e7df]" aria-label="Loading map" />,
});

type DiscoverTabProps = {
  token: string;
  userName: string;
  coordinates: Coordinates | null;
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
  preferenceDraft: UserPreference | null;
  preferenceLoading: boolean;
  preferenceSaving: boolean;
  preferenceMessage: string;
  preferenceError: string;
  mobileView: "list" | "map";
  onRadiusChange: (value: number) => void;
  onMobileViewChange: (view: "list" | "map") => void;
  onUseCurrentLocation: () => void;
  onRetrySearch: () => void;
  onSavePreferences: FormEventHandler<HTMLFormElement>;
  onRetryPreferences: () => void;
  onTogglePurpose: (purpose: Purpose) => void;
  onUpdatePreference: <K extends keyof UserPreference>(key: K, value: UserPreference[K]) => void;
  onOpenDetails: (cafe: CafeDetail) => void;
  onSave: (cafe: CafeDetail) => void;
  onLike: (cafe: CafeDetail) => void;
  onDismiss: (cafe: CafeDetail) => void;
};

export function DiscoverTab({
  token,
  userName,
  coordinates,
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
  preferenceDraft,
  preferenceLoading,
  preferenceSaving,
  preferenceMessage,
  preferenceError,
  mobileView,
  onRadiusChange,
  onMobileViewChange,
  onUseCurrentLocation,
  onRetrySearch,
  onSavePreferences,
  onRetryPreferences,
  onTogglePurpose,
  onUpdatePreference,
  onOpenDetails,
  onSave,
  onLike,
  onDismiss,
}: DiscoverTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<"all" | "open" | "saved">("all");
  const [sortBy, setSortBy] = useState<"recommended" | "distance" | "rating" | "reviews">("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const isListView = mobileView === "list";

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(searchQuery.trim().toLocaleLowerCase()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  const searchMatches = cafes.filter((cafe) => cafe.name.toLocaleLowerCase().includes(debouncedQuery));
  const preferenceMatches = searchMatches.filter((cafe) => !preferenceDraft || (
    (cafe.distanceKm === undefined || cafe.distanceKm <= preferenceDraft.maxDistanceKm) &&
    (cafe.rating === null || cafe.rating >= preferenceDraft.minimumRating) &&
    (preferenceDraft.preferredPrice === "ANY" || cafe.priceLevel === null || cafe.priceLevel === preferenceDraft.preferredPrice)
  ));
  const filteredCafes = preferenceMatches.filter((cafe) => {
    if (quickFilter === "open") return cafe.isOpenNow === true;
    if (quickFilter === "saved") return savedIds.includes(cafe.placeId);
    return true;
  });
  const visibleCafes = [...filteredCafes].sort((a, b) => {
    if (sortBy === "distance") return (a.distanceKm ?? Number.MAX_VALUE) - (b.distanceKm ?? Number.MAX_VALUE);
    if (sortBy === "rating") return (b.rating ?? -1) - (a.rating ?? -1);
    if (sortBy === "reviews") return b.userRatingCount - a.userRatingCount;
    return 0;
  });

  return (
    <>
      <section className="mb-5 sm:mb-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#bcbd8b]/30 text-[#373d20]">
              <MapPin size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold text-[#373d20]">{coordinates ? "Cafe search area" : "Location not set"}</p>
              <p className="m-0 truncate text-xs text-[#717744]">{coordinates ? `${coordinates.latitude.toFixed(3)}, ${coordinates.longitude.toFixed(3)}` : "Choose your location to find cafes"}</p>
            </div>
          </div>
          <button type="button" onClick={onUseCurrentLocation} disabled={locationBusy} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#717744]/35 bg-white px-3 text-sm font-semibold text-[#373d20] transition-colors hover:bg-[#eff1ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] disabled:cursor-wait disabled:opacity-70">
            {locationBusy ? <span className="size-4 animate-spin rounded-full border-2 border-[#717744]/35 border-t-[#373d20]" aria-hidden="true" /> : <RefreshCw size={17} aria-hidden="true" />}
            <span>{locationBusy ? "Locating" : coordinates ? "Refresh" : "Locate me"}</span>
          </button>
        </div>
        <h1 className="mb-1 font-bold sm:mb-2 text-xl text-[#3d0814]">Hello, {userName}!</h1>
        <h1 className="m-0 text-2xl font-bold leading-tight sm:text-4xl">Find a cafe for today</h1>
      </section>

      <section className="mb-6" aria-label="Search and filter cafes">
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search cafes</span>
            <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#717744]" />
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search cafes nearby" className="min-h-12 w-full rounded-full border border-[#bcbd8b]/65 bg-white pl-11 pr-4 text-sm text-[#373d20] outline-none placeholder:text-[#717744]/70 focus:border-[#373d20] focus:ring-2 focus:ring-[#bcbd8b]" />
          </label>
          <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} aria-controls={filtersOpen ? "discover-filters" : undefined} aria-label={filtersOpen ? "Hide search filters" : "Show search filters"} title={filtersOpen ? "Hide search filters" : "Show search filters"} className={`grid size-12 shrink-0 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2 ${filtersOpen ? "bg-[#717744] text-white" : "bg-[#373d20] text-white hover:bg-[#4a5230]"}`}>
            <SlidersHorizontal size={19} aria-hidden="true" />
          </button>
        </div>

        {filtersOpen && (
          <div id="discover-filters" className="mt-3 grid gap-3 rounded-lg border border-[#bcbd8b]/65 bg-white p-4 sm:grid-cols-2">
            <div className="grid gap-1.5 text-xs font-semibold text-[#717744]">
              <span>Search radius</span>
              <Select aria-label="Search radius" selectedKey={String(radius)} onSelectionChange={(key) => { if (key !== null) onRadiusChange(Number(key)); }} className="w-full">
                <Select.Trigger className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-[#717744]/40 bg-white px-3 text-left text-sm font-medium text-[#373d20] shadow-none outline-none hover:border-[#373d20] focus-visible:ring-2 focus-visible:ring-[#bcbd8b]">
                  <Select.Value />
                  <Select.Indicator className="size-4 shrink-0 text-[#717744]" />
                </Select.Trigger>
                <Select.Popover className="z-50 min-w-44 rounded-md border border-[#717744]/30 bg-white p-1 text-sm text-[#373d20] shadow-md">
                  <ListBox aria-label="Search radius options">
                    <ListBox.Item id="1000" className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">Within 1 km</ListBox.Item>
                    <ListBox.Item id="3000" className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">Within 3 km</ListBox.Item>
                    <ListBox.Item id="5000" className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">Within 5 km</ListBox.Item>
                    <ListBox.Item id="10000" className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">Within 10 km</ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            <div className="grid gap-1.5 text-xs font-semibold text-[#717744]">
              <span>Sort by</span>
              <Select aria-label="Sort cafes by" selectedKey={sortBy} onSelectionChange={(key) => { if (key !== null) setSortBy(String(key) as typeof sortBy); }} className="w-full">
                <Select.Trigger className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-[#717744]/40 bg-white px-3 text-left text-sm font-medium text-[#373d20] shadow-none outline-none hover:border-[#373d20] focus-visible:ring-2 focus-visible:ring-[#bcbd8b]">
                  <Select.Value />
                  <Select.Indicator className="size-4 shrink-0 text-[#717744]" />
                </Select.Trigger>
                <Select.Popover className="z-50 min-w-44 rounded-md border border-[#717744]/30 bg-white p-1 text-sm text-[#373d20] shadow-md">
                  <ListBox aria-label="Sort options">
                    <ListBox.Item id="recommended" className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">Recommended</ListBox.Item>
                    <ListBox.Item id="distance" className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">Nearest</ListBox.Item>
                    <ListBox.Item id="rating" className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">Highest rating</ListBox.Item>
                    <ListBox.Item id="reviews" className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">Most reviews</ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            {preferenceLoading && <div role="status" aria-label="Loading cafe preferences" className="sm:col-span-2"><SkeletonRows kind="form" /><span className="sr-only">Loading cafe preferences</span></div>}
            {preferenceError && <p role="alert" className="m-0 text-sm leading-5 text-[#3d0814] sm:col-span-2">{preferenceError} <button type="button" onClick={onRetryPreferences} className="font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d0814]">Try again</button></p>}
            {preferenceDraft && !preferenceLoading && (
              <form onSubmit={onSavePreferences} className="space-y-4 border-t border-[#bcbd8b]/65 pt-4 sm:col-span-2">
                <h3 className="m-0 text-base font-bold text-[#373d20]">Cafe preferences</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-1.5 text-xs font-semibold text-[#717744]">
                    <span>Maximum distance</span>
                    <Select aria-label="Maximum distance" selectedKey={String(preferenceDraft.maxDistanceKm)} onSelectionChange={(key) => { if (key !== null) onUpdatePreference("maxDistanceKm", Number(key)); }} className="w-full">
                      <Select.Trigger className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-[#717744]/40 bg-white px-3 text-left text-sm font-medium text-[#373d20] shadow-none outline-none hover:border-[#373d20] focus-visible:ring-2 focus-visible:ring-[#bcbd8b]">
                        <Select.Value />
                        <Select.Indicator className="size-4 shrink-0 text-[#717744]" />
                      </Select.Trigger>
                      <Select.Popover className="z-50 min-w-44 rounded-md border border-[#717744]/30 bg-white p-1 text-sm text-[#373d20] shadow-md">
                        <ListBox aria-label="Maximum distance options">
                          {[1, 3, 5, 10].map((value) => <ListBox.Item key={value} id={String(value)} className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">Within {value} km</ListBox.Item>)}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                  <div className="grid gap-1.5 text-xs font-semibold text-[#717744]">
                    <span>Minimum rating</span>
                    <Select aria-label="Minimum rating" selectedKey={String(preferenceDraft.minimumRating)} onSelectionChange={(key) => { if (key !== null) onUpdatePreference("minimumRating", Number(key)); }} className="w-full">
                      <Select.Trigger className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-[#717744]/40 bg-white px-3 text-left text-sm font-medium text-[#373d20] shadow-none outline-none hover:border-[#373d20] focus-visible:ring-2 focus-visible:ring-[#bcbd8b]">
                        <Select.Value />
                        <Select.Indicator className="size-4 shrink-0 text-[#717744]" />
                      </Select.Trigger>
                      <Select.Popover className="z-50 min-w-44 rounded-md border border-[#717744]/30 bg-white p-1 text-sm text-[#373d20] shadow-md">
                        <ListBox aria-label="Minimum rating options">
                          {[4, 4.2, 4.5].map((value) => <ListBox.Item key={value} id={String(value)} className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">{value.toFixed(1)} and above</ListBox.Item>)}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                  <div className="grid gap-1.5 text-xs font-semibold text-[#717744]">
                    <span>Preferred price</span>
                    <Select aria-label="Preferred price" selectedKey={preferenceDraft.preferredPrice} onSelectionChange={(key) => { if (key !== null) onUpdatePreference("preferredPrice", String(key) as PricePreference); }} className="w-full">
                      <Select.Trigger className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-[#717744]/40 bg-white px-3 text-left text-sm font-medium text-[#373d20] shadow-none outline-none hover:border-[#373d20] focus-visible:ring-2 focus-visible:ring-[#bcbd8b]">
                        <Select.Value />
                        <Select.Indicator className="size-4 shrink-0 text-[#717744]" />
                      </Select.Trigger>
                      <Select.Popover className="z-50 min-w-44 rounded-md border border-[#717744]/30 bg-white p-1 text-sm text-[#373d20] shadow-md">
                        <ListBox aria-label="Preferred price options">
                          {(Object.keys(priceLabels) as PricePreference[]).map((value) => <ListBox.Item key={value} id={value} className="cursor-pointer rounded px-3 py-2 outline-none hover:bg-[#eff1ed] data-[focused]:bg-[#eff1ed] data-[selected]:font-semibold">{priceLabels[value]}</ListBox.Item>)}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                </div>
                <fieldset className="border-0 p-0">
                  <legend className="mb-2 text-sm font-semibold text-[#373d20]">What are you looking for?</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {purposeOptions.map(({ value, label }) => (
                      <label key={value} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-[#717744] ${preferenceDraft.purposes.includes(value) ? "border-[#373d20] bg-[#bcbd8b]/35 font-semibold" : "border-[#717744]/30 bg-white hover:bg-[#eff1ed]"}`}>
                        <input type="checkbox" checked={preferenceDraft.purposes.includes(value)} onChange={() => onTogglePurpose(value)} className="size-4 shrink-0 accent-[#373d20]" />{label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {preferenceMessage && <p role="status" className="m-0 text-sm font-semibold text-[#373d20]">{preferenceMessage}</p>}
                <button type="submit" disabled={preferenceSaving} className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#373d20] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#4a5230] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{preferenceSaving ? "Saving..." : "Apply preferences"}</button>
              </form>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Quick cafe filters">
          {([
            ["all", "All"],
            ["open", "Open now"],
            ["saved", "Saved"],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setQuickFilter(value)} aria-pressed={quickFilter === value} className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2 ${quickFilter === value ? "bg-[#373d20] text-white" : "bg-white text-[#373d20] hover:bg-[#bcbd8b]/35"}`}>
              {label}
            </button>
          ))}
        </div>

        {locationError && <p role="alert" className="mb-0 mt-3 text-sm text-[#3d0814]">{locationError}</p>}
        {locationMessage && <p role="status" className="mb-0 mt-3 text-sm text-[#717744]">{locationMessage}</p>}
      </section>

      <div className="mb-4 flex min-h-11 items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg font-bold">Recommended cafes</h2>
          <p className="mb-0 mt-1 text-sm text-[#717744]">
            {coordinates ? `${visibleCafes.length}${debouncedQuery ? " matching" : ""} places${source === "mock" ? " (sample data)" : ""}` : "Start with your current location"}
          </p>
        </div>
        <div className="flex rounded-md border border-[#717744]/35 bg-white p-1 lg:hidden" role="group" aria-label="Choose list or map view">
          <button type="button" onClick={() => onMobileViewChange("list")} aria-pressed={isListView} className={`inline-flex min-h-11 items-center gap-1.5 rounded px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] ${isListView ? "bg-[#373d20] text-white" : "text-[#717744]"}`}><Coffee size={16} aria-hidden="true" />List</button>
          <button type="button" onClick={() => onMobileViewChange("map")} aria-pressed={!isListView} className={`inline-flex min-h-11 items-center gap-1.5 rounded px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] ${!isListView ? "bg-[#373d20] text-white" : "text-[#717744]"}`}><Map size={16} aria-hidden="true" />Map</button>
        </div>
      </div>

      {searchError && <div role="alert" className="mb-5 flex items-center justify-between gap-3 border border-[#3d0814]/20 bg-white px-4 py-3 text-sm text-[#3d0814]"><span>{searchError}</span><button type="button" onClick={onRetrySearch} className="min-h-11 shrink-0 rounded px-3 font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d0814]">Try again</button></div>}

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-9">
        <section className={`${isListView ? "block" : "hidden"} min-w-0`} aria-label="Recommended cafe list" aria-busy={searchLoading}>
          {searchLoading && <SkeletonRows kind="cafes" />}
          {!coordinates && !searchLoading && (
            <div className="border-y border-[#bcbd8b]/70 py-10 text-center sm:py-14">
              <MapPin size={26} className="mx-auto text-[#717744]" aria-hidden="true" />
              <h3 className="mb-0 mt-3 text-lg font-bold">Start with your location</h3>
              <p className="mx-auto mb-0 mt-2 max-w-sm text-sm leading-6 text-[#717744]">Use your current location to see cafes nearby.</p>
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
              <h3 className="mb-0 mt-3 text-lg font-bold">{searchMatches.length === 0 ? "No cafes match your search" : preferenceMatches.length === 0 ? "No cafes match your preferences" : "No cafes match this filter"}</h3>
              <p className="mx-auto mb-0 mt-2 max-w-sm text-sm leading-6 text-[#717744]">Adjust your search or filters to see more cafes.</p>
              <button type="button" onClick={() => { setSearchQuery(""); setQuickFilter("all"); setFiltersOpen(true); }} className="mt-4 min-h-11 rounded-md border border-[#717744]/40 px-4 text-sm font-semibold hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744]">Adjust filters</button>
            </div>
          )}
          {!searchLoading && (
            <div className="grid grid-cols-1 gap-4">
              {visibleCafes.map((cafe) => (
                <CafeCard
                  key={cafe.placeId}
                  cafe={cafe}
                  token={token}
                  isSaved={savedIds.includes(cafe.placeId)}
                  isLiked={likedIds.includes(cafe.placeId)}
                  busy={Boolean(busyPlaceId) || detailsLoadingId === cafe.placeId}
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
              <CafeMap center={coordinates} cafes={visibleCafes} onSelect={onOpenDetails} />
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
