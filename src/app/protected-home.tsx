"use client";

import Image from "next/image";
import {
  Bookmark,
  Check,
  Compass,
  ExternalLink,
  Heart,
  History as HistoryIcon,
  LogOut,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type {
  Cafe,
  Coordinates,
  InteractionType,
  Purpose,
  RecommendedCafe,
  UserPreference,
} from "@/types/cafe";
import { DiscoverTab } from "@/features/dashboard/tabs/discover";
import { HistoryTab } from "@/features/dashboard/tabs/history";
import { ProfileTab } from "@/features/dashboard/tabs/profile";
import { SavedTab } from "@/features/dashboard/tabs/saved";
import { formatCount, formatDistance, formatPrice, getMapUrl, SkeletonRows } from "@/features/dashboard/shared";
import type { CafeDetail, HistoryEntry, Tab } from "@/features/dashboard/types";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

const tabs: Array<{ id: Tab; label: string; icon: typeof Compass }> = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "favorites", label: "Saved", icon: Bookmark },
  { id: "history", label: "Activity", icon: HistoryIcon },
  { id: "profile", label: "Profile", icon: UserRound },
];

async function apiRequest<T>(token: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body) headers.set("Content-Type", "application/json");

  const response = await fetch(path, { ...init, headers });
  const result = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (response.status === 401) {
    window.location.replace("/login");
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok || !result?.ok) {
    throw new Error(result && !result.ok ? result.error.code : "REQUEST_FAILED");
  }

  return result.data;
}

function CafeDetailDialog({
  cafe,
  isSaved,
  onClose,
  onSave,
  onLike,
  onVisited,
}: {
  cafe: CafeDetail;
  isSaved: boolean;
  onClose: () => void;
  onSave: () => void;
  onLike: () => void;
  onVisited: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    return () => {
      if (dialogRef.current?.open) dialogRef.current.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="cafe-detail-title"
      className="m-auto max-h-[min(88dvh,760px)] w-[calc(100%-1rem)] max-w-xl overflow-y-auto rounded-lg border-0 bg-white p-0 text-[#373d20] shadow-xl backdrop:bg-[#373d20]/55"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#bcbd8b]/70 p-5 sm:p-7">
        <div>
          <p className="m-0 text-xs font-semibold uppercase text-[#717744]">Cafe details</p>
          <h2 id="cafe-detail-title" className="mb-0 mt-2 text-2xl font-bold leading-tight">{cafe.name}</h2>
        </div>
        <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close details" className="grid size-11 shrink-0 place-items-center rounded-md text-[#717744] hover:bg-[#eff1ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744]">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-6 p-5 sm:p-7">
        <div className="grid grid-cols-2 gap-y-4 border-b border-[#bcbd8b]/70 pb-5 text-sm">
          <span className="text-[#717744]">Rating</span><span className="text-right font-semibold">{cafe.rating?.toFixed(1) ?? "Not available"} {cafe.rating !== null ? `(${formatCount(cafe.userRatingCount)} reviews)` : ""}</span>
          <span className="text-[#717744]">Distance</span><span className="text-right font-semibold">{formatDistance(cafe.distanceKm) ?? "Not available"}</span>
          <span className="text-[#717744]">Price</span><span className="text-right font-semibold">{formatPrice(cafe.priceLevel)}</span>
          <span className="text-[#717744]">Status</span><span className="text-right font-semibold">{cafe.isOpenNow === true ? "Open now" : cafe.isOpenNow === false ? "Closed" : "Hours unavailable"}</span>
          {cafe.recommendationScore !== undefined && <><span className="text-[#717744]">Recommendation match</span><span className="text-right font-bold text-[#3d0814]">{cafe.recommendationScore}%</span></>}
        </div>
        {cafe.reasons && cafe.reasons.length > 0 && (
          <section>
            <h3 className="m-0 text-base font-bold">Why it fits</h3>
            <ul className="mb-0 mt-3 space-y-2 pl-5 text-sm leading-6 text-[#717744]">
              {cafe.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </section>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onVisited} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#373d20] px-4 text-sm font-semibold text-white hover:bg-[#4a5230] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2">
            <Check size={17} aria-hidden="true" /> Mark visited
          </button>
          <button type="button" onClick={onLike} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#717744]/40 px-4 text-sm font-semibold hover:bg-[#eff1ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2">
            <Heart size={17} aria-hidden="true" /> Like
          </button>
          <button type="button" onClick={onSave} aria-pressed={isSaved} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#717744]/40 px-4 text-sm font-semibold hover:bg-[#eff1ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2">
            <Bookmark size={17} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" /> {isSaved ? "Saved" : "Save"}
          </button>
          <a href={getMapUrl(cafe)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-[#717744] hover:bg-[#eff1ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744]">
            Open in Maps <ExternalLink size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </dialog>
  );
}

function LogoutDialog({
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    return () => {
      if (dialogRef.current?.open) dialogRef.current.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) dialogRef.current?.close();
      }}
      onClose={onCancel}
      aria-labelledby="logout-title"
      aria-describedby="logout-description"
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border-0 bg-white p-0 text-[#373d20] shadow-xl backdrop:bg-[#373d20]/55"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-xs font-semibold uppercase text-[#717744]">Cafinity account</p>
            <h2 id="logout-title" className="mb-0 mt-2 text-xl font-bold">Sign out?</h2>
          </div>
          <button type="button" onClick={() => dialogRef.current?.close()} disabled={busy} aria-label="Close sign out confirmation" className="grid size-11 shrink-0 place-items-center rounded-md text-[#717744] hover:bg-[#eff1ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] disabled:opacity-50">
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        <p id="logout-description" className="mb-0 mt-3 text-sm leading-6 text-[#717744]">Are you sure you want to sign out of your account?</p>
        {error && <p role="alert" className="mb-0 mt-3 text-sm text-[#3d0814]">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => dialogRef.current?.close()} disabled={busy} className="min-h-11 rounded-md border border-[#717744]/35 px-4 text-sm font-semibold hover:bg-[#eff1ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#3d0814] px-4 text-sm font-semibold text-white hover:bg-[#571324] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d0814] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
            <LogOut size={16} aria-hidden="true" />{busy ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function ProtectedHome() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [latitudeInput, setLatitudeInput] = useState("");
  const [longitudeInput, setLongitudeInput] = useState("");
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [radius, setRadius] = useState(3000);
  const [cafes, setCafes] = useState<RecommendedCafe[]>([]);
  const [source, setSource] = useState<"google_places" | "mock" | "">("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [busyPlaceId, setBusyPlaceId] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [favorites, setFavorites] = useState<Cafe[] | null>(null);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState("");
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [preference, setPreference] = useState<UserPreference | null>(null);
  const [preferenceDraft, setPreferenceDraft] = useState<UserPreference | null>(null);
  const [preferenceLoading, setPreferenceLoading] = useState(false);
  const [preferenceSaving, setPreferenceSaving] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const [preferenceError, setPreferenceError] = useState("");
  const [actionError, setActionError] = useState("");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [selectedCafe, setSelectedCafe] = useState<CafeDetail | null>(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState("");
  const supabaseRef = useRef<ReturnType<typeof createBrowserSupabaseClient> | null>(null);

  useEffect(() => {
    let mounted = true;
    let supabase: ReturnType<typeof createBrowserSupabaseClient>;

    try {
      supabase = createBrowserSupabaseClient();
      supabaseRef.current = supabase;
    } catch {
      window.location.replace("/login");
      return;
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error || !data.session) {
        window.location.replace("/login");
        return;
      }
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        window.location.replace("/login");
        return;
      }
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadRecommendations(token: string, origin: Coordinates, distance: number) {
    setSearchLoading(true);
    setSearchError("");
    const params = new URLSearchParams({
      latitude: String(origin.latitude),
      longitude: String(origin.longitude),
      radius: String(distance),
    });

    try {
      const result = await apiRequest<{
        source: "google_places" | "mock";
        cafes: RecommendedCafe[];
        preference: UserPreference;
        interactionSignal: { savedPlaceIds: string[]; likedPlaceIds: string[] };
      }>(token, `/api/recommendations?${params}`);
      setCafes(result.cafes);
      setSource(result.source);
      setPreference(result.preference);
      setPreferenceDraft(result.preference);
      setSavedIds(result.interactionSignal.savedPlaceIds);
      setLikedIds(result.interactionSignal.likedPlaceIds);
    } catch {
      setSearchError("Recommendations could not be loaded. Check your connection and try again.");
    } finally {
      setSearchLoading(false);
    }
  }

  function useCurrentLocation() {
    if (!session) return;
    if (!navigator.geolocation) {
      setLocationError("This browser does not support location. Enter coordinates manually.");
      return;
    }

    setLocationBusy(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoordinates(origin);
        setLatitudeInput(String(origin.latitude));
        setLongitudeInput(String(origin.longitude));
        setLocationBusy(false);
        void loadRecommendations(session.access_token, origin, radius);
      },
      (error) => {
        setLocationBusy(false);
        setLocationError(error.code === error.PERMISSION_DENIED
          ? "Izin lokasi ditolak. Masukkan koordinat secara manual untuk mencari café."
          : "Lokasi tidak berhasil diperoleh. Coba lagi atau masukkan koordinat manual.");
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 12000 },
    );
  }

  function submitManualLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const latitude = Number(latitudeInput);
    const longitude = Number(longitudeInput);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setLocationError("Enter a latitude from -90 to 90 and a longitude from -180 to 180.");
      return;
    }
    const origin = { latitude, longitude };
    setCoordinates(origin);
    setLocationError("");
    void loadRecommendations(session.access_token, origin, radius);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (session && coordinates) void loadRecommendations(session.access_token, coordinates, radius);
  }

  async function loadFavorites(token: string) {
    setFavoritesLoading(true);
    setFavoritesError("");
    try {
      const params = new URLSearchParams();
      if (coordinates) {
        params.set("latitude", String(coordinates.latitude));
        params.set("longitude", String(coordinates.longitude));
      }
      const query = params.toString();
      const result = await apiRequest<{ cafes: Cafe[]; placeIds: string[] }>(token, `/api/favorites${query ? `?${query}` : ""}`);
      setFavorites(result.cafes);
      setSavedIds((current) => Array.from(new Set([...current, ...result.placeIds])));
    } catch {
      setFavoritesError("Saved cafés could not be loaded. Try again.");
    } finally {
      setFavoritesLoading(false);
    }
  }

  async function loadHistory(token: string) {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const result = await apiRequest<{ history: Record<string, HistoryEntry[]> }>(token, "/api/history");
      setHistory(Object.values(result.history).flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch {
      setHistoryError("Activity could not be loaded. Try again.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadPreference(token: string) {
    setPreferenceLoading(true);
    setPreferenceError("");
    try {
      const result = await apiRequest<{ preference: UserPreference }>(token, "/api/preferences");
      setPreference(result.preference);
      setPreferenceDraft(result.preference);
    } catch {
      setPreferenceError("Preferences could not be loaded. Try again.");
    } finally {
      setPreferenceLoading(false);
    }
  }

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    if (!session) return;
    if (tab === "favorites" && favorites === null && !favoritesLoading) void loadFavorites(session.access_token);
    if (tab === "history" && history === null && !historyLoading) void loadHistory(session.access_token);
    if (tab === "profile" && preferenceDraft === null && !preferenceLoading) void loadPreference(session.access_token);
  }

  async function performInteraction(cafe: CafeDetail, interactionType: InteractionType) {
    if (!session) return;
    setBusyPlaceId(cafe.placeId);
    setActionError("");
    try {
      await apiRequest(session.access_token, "/api/interactions", {
        method: "POST",
        body: JSON.stringify({ placeId: cafe.placeId, interactionType }),
      });
      setHistory(null);
      if (interactionType === "LIKE") setLikedIds((current) => current.includes(cafe.placeId) ? current : [...current, cafe.placeId]);
      if (interactionType === "SAVE") {
        setSavedIds((current) => current.includes(cafe.placeId) ? current : [...current, cafe.placeId]);
        setFavorites(null);
      }
      if (interactionType === "NOT_INTERESTED") setCafes((current) => current.filter((item) => item.placeId !== cafe.placeId));
      if (interactionType === "VISITED") setSelectedCafe(null);
    } catch {
      setActionError("Your action could not be saved. Check your connection and try again.");
    } finally {
      setBusyPlaceId("");
    }
  }

  async function toggleFavorite(cafe: CafeDetail) {
    if (!session) return;
    setBusyPlaceId(cafe.placeId);
    const currentlySaved = savedIds.includes(cafe.placeId);
    setActionError("");
    try {
      if (currentlySaved) {
        const params = new URLSearchParams({ placeId: cafe.placeId });
        await apiRequest(session.access_token, `/api/favorites?${params}`, { method: "DELETE" });
        setSavedIds((current) => current.filter((id) => id !== cafe.placeId));
        setFavorites((current) => current?.filter((item) => item.placeId !== cafe.placeId) ?? null);
      } else {
        await apiRequest(session.access_token, "/api/interactions", {
          method: "POST",
          body: JSON.stringify({ placeId: cafe.placeId, interactionType: "SAVE" }),
        });
        setSavedIds((current) => [...current, cafe.placeId]);
        setFavorites(null);
      }
      setHistory(null);
    } catch {
      setActionError("The saved status could not be changed. Check your connection and try again.");
    } finally {
      setBusyPlaceId("");
    }
  }

  async function openDetails(cafe: RecommendedCafe | Cafe) {
    if (!session) return;
    setDetailsLoadingId(cafe.placeId);
    setActionError("");
    try {
      const params = new URLSearchParams();
      if (coordinates) {
        params.set("latitude", String(coordinates.latitude));
        params.set("longitude", String(coordinates.longitude));
      }
      const query = params.size ? `?${params}` : "";
      const result = await apiRequest<{ cafe: Cafe }>(session.access_token, `/api/places/${encodeURIComponent(cafe.placeId)}${query}`);
      setSelectedCafe({ ...result.cafe, ...("recommendationScore" in cafe ? { recommendationScore: cafe.recommendationScore, scoreBreakdown: cafe.scoreBreakdown, reasons: cafe.reasons } : {}) });
    } catch {
      setActionError("Cafe details could not be loaded. Try again.");
    } finally {
      setDetailsLoadingId("");
    }
  }

  function updatePreference<K extends keyof UserPreference>(key: K, value: UserPreference[K]) {
    setPreferenceDraft((current) => current ? { ...current, [key]: value } : current);
    setPreferenceMessage("");
  }

  function togglePurpose(purpose: Purpose) {
    const current = preferenceDraft?.purposes ?? [];
    updatePreference("purposes", current.includes(purpose)
      ? current.filter((item) => item !== purpose)
      : [...current, purpose]);
  }

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !preferenceDraft) return;
    setPreferenceSaving(true);
    setPreferenceError("");
    setPreferenceMessage("");
    try {
      const result = await apiRequest<{ preference: UserPreference }>(session.access_token, "/api/preferences", {
        method: "PUT",
        body: JSON.stringify({
          maxDistanceKm: preferenceDraft.maxDistanceKm,
          minimumRating: preferenceDraft.minimumRating,
          preferredPrice: preferenceDraft.preferredPrice,
          purposes: preferenceDraft.purposes,
        }),
      });
      setPreference(result.preference);
      setPreferenceDraft(result.preference);
      setPreferenceMessage("Preferences saved.");
      if (coordinates) await loadRecommendations(session.access_token, coordinates, radius);
    } catch {
      setPreferenceError("Preferences could not be saved. Check your connection and try again.");
    } finally {
      setPreferenceSaving(false);
    }
  }

  async function confirmSignOut() {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setLogoutBusy(true);
    setLogoutError("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.replace("/login");
    } catch {
      setLogoutError("Sign out failed. Check your connection and try again.");
      setLogoutBusy(false);
    }
  }

  if (authLoading || !session) {
    return (
      <main className="min-h-dvh bg-[#eff1ed] px-4 text-[#373d20] sm:px-6">
        <div role="status" aria-label="Checking your session" className="mx-auto max-w-[1440px]">
          <div className="flex min-h-[68px] items-center justify-between border-b border-[#bcbd8b]/65 bg-white px-2">
            <div className="h-8 w-32 bg-[#bcbd8b]/35" />
            <div className="h-9 w-20 rounded-md bg-[#bcbd8b]/25" />
          </div>
          <div className="space-y-6 py-8">
            <div className="h-4 w-40 bg-[#bcbd8b]/30" />
            <div className="h-9 w-72 max-w-full bg-[#bcbd8b]/45" />
            <div className="h-12 w-full max-w-sm rounded-md bg-[#bcbd8b]/25" />
            <SkeletonRows kind="cafes" />
          </div>
          <span className="sr-only">Checking your session</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#eff1ed] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-[#373d20] lg:pb-10">
      <header className="border-b border-[#bcbd8b]/65 bg-white">
        <div className="mx-auto flex min-h-[68px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <a href="#discover" onClick={(event) => { event.preventDefault(); selectTab("discover"); }} className="flex min-h-11 items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744]" aria-label="Cafinity home">
            <Image src="/images/logo.png" alt="" width={36} height={40} className="h-9 w-9 object-contain" />
            <span className="text-[1.7rem] leading-none text-[#3d0814]" style={{ fontFamily: "Lobster, cursive" }}>Cafinity</span>
          </a>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => selectTab(id)} aria-current={activeTab === id ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] ${activeTab === id ? "bg-[#eff1ed] text-[#373d20]" : "text-[#717744] hover:bg-[#eff1ed] hover:text-[#373d20]"}`}>
                <Icon size={17} aria-hidden="true" />{label}
              </button>
            ))}
          </nav>
          <button type="button" onClick={() => { setLogoutError(""); setLogoutDialogOpen(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-[#717744] hover:bg-[#eff1ed] hover:text-[#373d20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744]">
            <LogOut size={17} aria-hidden="true" /><span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 pb-7 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">
        {actionError && <p role="alert" className="mb-5 border border-[#3d0814]/20 bg-white px-4 py-3 text-sm text-[#3d0814]">{actionError}</p>}
        <div key={activeTab} className="tab-panel-enter">
          {activeTab === "discover" && (
            <DiscoverTab
              token={session.access_token}
              coordinates={coordinates}
              latitudeInput={latitudeInput}
              longitudeInput={longitudeInput}
              locationBusy={locationBusy}
              locationError={locationError}
              radius={radius}
              cafes={cafes}
              source={source}
              searchLoading={searchLoading}
              searchError={searchError}
              savedIds={savedIds}
              likedIds={likedIds}
              busyPlaceId={busyPlaceId}
              detailsLoadingId={detailsLoadingId}
              preference={preference}
              mobileView={mobileView}
              onLatitudeChange={setLatitudeInput}
              onLongitudeChange={setLongitudeInput}
              onRadiusChange={setRadius}
              onMobileViewChange={setMobileView}
              onUseCurrentLocation={useCurrentLocation}
              onSearchSubmit={submitSearch}
              onManualLocationSubmit={submitManualLocation}
              onRetrySearch={() => { if (coordinates) void loadRecommendations(session.access_token, coordinates, radius); }}
              onOpenDetails={(cafe) => void openDetails(cafe)}
              onSave={(cafe) => void toggleFavorite(cafe)}
              onLike={(cafe) => void performInteraction(cafe, "LIKE")}
              onDismiss={(cafe) => void performInteraction(cafe, "NOT_INTERESTED")}
            />
          )}

          {activeTab === "favorites" && (
            <SavedTab
              token={session.access_token}
              cafes={favorites}
              loading={favoritesLoading}
              error={favoritesError}
              savedIds={savedIds}
              likedIds={likedIds}
              busyPlaceId={busyPlaceId}
              detailsLoadingId={detailsLoadingId}
              onRetry={() => void loadFavorites(session.access_token)}
              onDiscover={() => selectTab("discover")}
              onDetails={(cafe) => void openDetails(cafe)}
              onSave={(cafe) => void toggleFavorite(cafe)}
              onLike={(cafe) => void performInteraction(cafe, "LIKE")}
              onDismiss={(cafe) => void performInteraction(cafe, "NOT_INTERESTED")}
            />
          )}

          {activeTab === "history" && (
            <HistoryTab
              token={session.access_token}
              entries={history}
              cafes={cafes}
              favorites={favorites}
              loading={historyLoading}
              error={historyError}
              onRetry={() => void loadHistory(session.access_token)}
            />
          )}

          {activeTab === "profile" && (
            <ProfileTab
              preferenceDraft={preferenceDraft}
              loading={preferenceLoading}
              saving={preferenceSaving}
              message={preferenceMessage}
              error={preferenceError}
              onSave={savePreferences}
              onRetry={() => void loadPreference(session.access_token)}
              onTogglePurpose={togglePurpose}
              onUpdatePreference={updatePreference}
            />
          )}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-2 pb-[calc(12px+env(safe-area-inset-bottom))] lg:hidden" aria-label="Main navigation">
        <div className="flex max-w-full items-center justify-center gap-1 rounded-full bg-[#373d20] p-2 shadow-[0_8px_24px_rgba(55,61,32,0.24)]">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} type="button" onClick={() => selectTab(id)} aria-label={label} aria-current={active ? "page" : undefined} className={`flex h-12 shrink-0 items-center justify-center rounded-full transition-[width,gap,background-color,color] duration-300 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bcbd8b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#373d20] ${active ? "w-[108px] gap-2 bg-[#eff1ed] text-[#373d20]" : "w-12 gap-0 text-[#bcbd8b] hover:bg-white/10 hover:text-white"}`}>
                <Icon size={20} aria-hidden="true" />
                <span aria-hidden={!active} className={`overflow-hidden whitespace-nowrap text-sm font-semibold transition-[max-width,opacity,transform] duration-300 ease-out motion-reduce:transition-none ${active ? "max-w-20 translate-x-0 opacity-100" : "max-w-0 translate-x-1 opacity-0"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {selectedCafe && <CafeDetailDialog cafe={selectedCafe} isSaved={savedIds.includes(selectedCafe.placeId)} onClose={() => setSelectedCafe(null)} onSave={() => void toggleFavorite(selectedCafe)} onLike={() => void performInteraction(selectedCafe, "LIKE")} onVisited={() => void performInteraction(selectedCafe, "VISITED")} />}
      {logoutDialogOpen && <LogoutDialog busy={logoutBusy} error={logoutError} onCancel={() => setLogoutDialogOpen(false)} onConfirm={() => void confirmSignOut()} />}
    </main>
  );
}
