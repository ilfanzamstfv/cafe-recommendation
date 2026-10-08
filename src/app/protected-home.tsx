"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Check,
  Compass,
  ExternalLink,
  Heart,
  History as HistoryIcon,
  LogOut,
  MapPin,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { getDistanceKm } from "@/lib/geo/distance";
import type {
  Cafe,
  Coordinates,
  InteractionType,
  Purpose,
  RecommendedCafe,
  UserPreference,
} from "@/types/cafe";
import { DiscoverTab } from "@/app/pages/discover";
import { HistoryTab } from "@/app/pages/history";
import { ProfileTab } from "@/app/pages/profile";
import { SavedTab } from "@/app/pages/saved";
import { CafePhoto, formatCount, formatDistance, formatPrice, getMapUrl, SkeletonRows } from "@/features/dashboard/shared";
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
  token,
  cafe,
  isSaved,
  isLiked,
  busy,
  onClose,
  onSave,
  onLike,
  onVisited,
}: {
  token: string;
  cafe: CafeDetail;
  isSaved: boolean;
  isLiked: boolean;
  busy: boolean;
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
      className="m-auto max-h-[min(92dvh,860px)] w-[calc(100%-1rem)] max-w-2xl overflow-x-hidden overflow-y-auto rounded-lg border-0 bg-white p-0 text-[#373d20] shadow-xl backdrop:bg-[#373d20]/55"
    >
      <div className="relative">
        <CafePhoto cafe={cafe} token={token} />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2 pr-14">
          <span className={`rounded-md px-3 py-1.5 text-xs font-bold ${cafe.isOpenNow === true ? "bg-[#373d20] text-white" : cafe.isOpenNow === false ? "bg-[#3d0814] text-white" : "bg-white/95 text-[#373d20]"}`}>
            {cafe.isOpenNow === true ? "Open now" : cafe.isOpenNow === false ? "Closed" : "Hours unavailable"}
          </span>
          {cafe.recommendationScore !== undefined && <span className="rounded-md bg-[#3d0814] px-3 py-1.5 text-xs font-bold text-white">{cafe.recommendationScore}% match</span>}
        </div>
        <button type="button" onClick={() => dialogRef.current?.close()} aria-label="Close details" className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-white/95 text-[#373d20] shadow-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744]">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="p-4 sm:p-6">
        <header>
          {cafe.primaryType && <p className="mb-1 text-xs font-semibold uppercase text-[#717744]">{cafe.primaryType.replace(/_/g, " ")}</p>}
          <h2 id="cafe-detail-title" className="m-0 text-2xl font-bold leading-tight sm:text-3xl">{cafe.name}</h2>
        </header>

        <div className="mt-5 grid grid-cols-3 divide-x divide-[#bcbd8b]/70 border-y border-[#bcbd8b]/70 py-3">
          <div className="min-w-0 px-2 first:pl-0">
            <p className="m-0 text-xs text-[#717744]">Rating</p>
            <p className="mb-0 mt-1 flex items-center gap-1 text-sm font-bold text-[#373d20]">
              {cafe.rating !== null ? <><Star size={15} fill="currentColor" aria-hidden="true" />{cafe.rating.toFixed(1)}</> : "Unavailable"}
            </p>
            {cafe.rating !== null && <p className="m-0 mt-0.5 text-xs text-[#717744]">{formatCount(cafe.userRatingCount)} reviews</p>}
          </div>
          <div className="min-w-0 px-2">
            <p className="m-0 text-xs text-[#717744]">Distance</p>
            <p className="mb-0 mt-1 text-sm font-bold text-[#373d20]">{formatDistance(cafe.distanceKm) ?? "Unavailable"}</p>
          </div>
          <div className="min-w-0 px-2 pr-0">
            <p className="m-0 text-xs text-[#717744]">Price</p>
            <p className="mb-0 mt-1 break-words text-sm font-bold text-[#373d20]">{formatPrice(cafe.priceLevel)}</p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <MapPin size={19} className="mt-0.5 shrink-0 text-[#717744]" aria-hidden="true" />
          <div>
            <p className="m-0 text-sm font-semibold">Location</p>
            <p className="mb-0 mt-1 text-sm text-[#717744]">{cafe.location.latitude.toFixed(5)}, {cafe.location.longitude.toFixed(5)}</p>
          </div>
        </div>

        {cafe.reasons && cafe.reasons.length > 0 && (
          <section className="mt-5">
            <h3 className="m-0 text-sm font-bold">Why it fits</h3>
            <ul className="mb-0 mt-2 flex flex-wrap gap-2 p-0 text-sm text-[#373d20]">
              {cafe.reasons.map((reason) => <li key={reason} className="list-none rounded-md bg-[#eff1ed] px-3 py-2">{reason}</li>)}
            </ul>
          </section>
        )}

        <div className="mt-5 space-y-2 border-t border-[#bcbd8b]/70 pt-4">
          <a href={getMapUrl(cafe)} target="_blank" rel="noreferrer" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#373d20] px-4 text-sm font-semibold text-white hover:bg-[#4a5230] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2">
            Open in Maps <ExternalLink size={16} aria-hidden="true" />
          </a>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={onVisited} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-[#717744]/35 px-2 text-xs font-semibold text-[#373d20] hover:bg-[#eff1ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] disabled:cursor-wait disabled:opacity-60 sm:text-sm">
              <Check size={16} aria-hidden="true" /> Visited
            </button>
            <button type="button" onClick={onLike} aria-pressed={isLiked} disabled={busy} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] disabled:cursor-wait disabled:opacity-60 sm:text-sm ${isLiked ? "border-[#717744] bg-[#bcbd8b]/35 text-[#373d20]" : "border-[#717744]/35 text-[#373d20] hover:bg-[#eff1ed]"}`}>
              <Heart size={16} fill={isLiked ? "currentColor" : "none"} aria-hidden="true" /> {isLiked ? "Unlike" : "Like"}
            </button>
            <button type="button" onClick={onSave} aria-pressed={isSaved} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-[#717744]/35 px-2 text-xs font-semibold text-[#373d20] hover:bg-[#eff1ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] disabled:cursor-wait disabled:opacity-60 sm:text-sm">
              <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" /> {isSaved ? "Saved" : "Save"}
            </button>
          </div>
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
          <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
            <LogOut size={16} aria-hidden="true" />{busy ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function ProtectedHome({ activeTab }: { activeTab: Tab }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
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
  const locationRequestIdRef = useRef(0);
  const interactionBusyRef = useRef(false);
  const autoLocationRequestedRef = useRef(false);
  const userName = [session?.user.user_metadata.name, session?.user.user_metadata.full_name]
    .find((name): name is string => typeof name === "string" && name.trim().length > 0)
    ?.trim() || session?.user.email?.split("@")[0] || "there";

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
      loadTabData(activeTab, data.session.access_token);
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

  const loadRecommendations = useCallback(async (token: string, origin: Coordinates, distance: number) => {
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
      setPreferenceDraft((current) => current ?? result.preference);
      setSavedIds(result.interactionSignal.savedPlaceIds);
      setLikedIds(result.interactionSignal.likedPlaceIds);
    } catch {
      setSearchError("Recommendations could not be loaded. Check your connection and try again.");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const useCurrentLocation = useCallback(() => {
    if (!session) return;
    setLocationError("");
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationError("This browser does not support location. Try another browser.");
      return;
    }

    const requestId = ++locationRequestIdRef.current;
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (requestId !== locationRequestIdRef.current) return;
        const origin = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocationBusy(false);
        // ponytail: fixed 100 m jitter filter; use GPS accuracy if device noise causes excess searches.
        if (coordinates && getDistanceKm(coordinates, origin) < 0.1) {
          setLocationMessage("Your location is within 100 m of the current search area.");
          return;
        }
        setCoordinates(origin);
        void loadRecommendations(session.access_token, origin, radius);
      },
      (error) => {
        if (requestId !== locationRequestIdRef.current) return;
        setLocationBusy(false);
        setLocationError(error.code === error.PERMISSION_DENIED
          ? "Location permission denied. Allow location access in browser settings, then try again."
          : "Location could not be obtained. Try again.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }, [coordinates, loadRecommendations, radius, session]);

  useEffect(() => {
    if (authLoading || !session || activeTab !== "discover" || autoLocationRequestedRef.current) return;
    autoLocationRequestedRef.current = true;
    useCurrentLocation();
  }, [activeTab, authLoading, session, useCurrentLocation]);

  function updateRadius(distance: number) {
    setRadius(distance);
    if (session && coordinates) void loadRecommendations(session.access_token, coordinates, distance);
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
      setSavedIds(result.placeIds);
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
      setPreferenceDraft(result.preference);
    } catch {
      setPreferenceError("Preferences could not be loaded. Try again.");
    } finally {
      setPreferenceLoading(false);
    }
  }

  function loadTabData(tab: Tab, token: string) {
    if (tab === "favorites" && favorites === null && !favoritesLoading) void loadFavorites(token);
    if (tab === "history" && history === null && !historyLoading) void loadHistory(token);
    if (tab === "discover" && preferenceDraft === null && !preferenceLoading) void loadPreference(token);
  }

  function selectTab(tab: Tab) {
    if (tab === activeTab) return;
    if (session) loadTabData(tab, session.access_token);
    router.push(`/pages/${tab === "favorites" ? "saved" : tab}`);
  }

  async function performInteraction(cafe: CafeDetail, interactionType: InteractionType) {
    if (!session || interactionBusyRef.current) return;
    interactionBusyRef.current = true;
    setBusyPlaceId(cafe.placeId);
    setActionError("");
    try {
      await apiRequest(session.access_token, "/api/interactions", {
        method: "POST",
        body: JSON.stringify({ placeId: cafe.placeId, interactionType }),
      });
      setHistory(null);
      if (interactionType === "LIKE") setLikedIds((current) => current.includes(cafe.placeId) ? current : [...current, cafe.placeId]);
      if (interactionType === "UNLIKE") setLikedIds((current) => current.filter((id) => id !== cafe.placeId));
      if (interactionType === "SAVE") {
        setSavedIds((current) => current.includes(cafe.placeId) ? current : [...current, cafe.placeId]);
        setFavorites(null);
      }
      if (interactionType === "NOT_INTERESTED") setCafes((current) => current.filter((item) => item.placeId !== cafe.placeId));
      if (interactionType === "VISITED") setSelectedCafe(null);
    } catch {
      setActionError("Your action could not be saved. Check your connection and try again.");
    } finally {
      interactionBusyRef.current = false;
      setBusyPlaceId("");
    }
  }

  function toggleLike(cafe: CafeDetail) {
    return performInteraction(cafe, likedIds.includes(cafe.placeId) ? "UNLIKE" : "LIKE");
  }

  async function toggleFavorite(cafe: CafeDetail) {
    if (!session || interactionBusyRef.current) return;
    interactionBusyRef.current = true;
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
      interactionBusyRef.current = false;
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
      setPreferenceDraft(result.preference);
      setPreferenceMessage("Preferences saved.");
      const nextRadius = result.preference.maxDistanceKm * 1000;
      setRadius(nextRadius);
      if (coordinates) await loadRecommendations(session.access_token, coordinates, nextRadius);
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
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 pb-7 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">
        {actionError && <p role="alert" className="mb-5 border border-[#3d0814]/20 bg-white px-4 py-3 text-sm text-[#3d0814]">{actionError}</p>}
        <div key={activeTab} className="tab-panel-enter">
          {activeTab === "discover" && (
            <DiscoverTab
              token={session.access_token}
              userName={userName}
              coordinates={coordinates}
              locationBusy={locationBusy}
              locationError={locationError}
              locationMessage={locationMessage}
              radius={radius}
              cafes={cafes}
              source={source}
              searchLoading={searchLoading}
              searchError={searchError}
              savedIds={savedIds}
              likedIds={likedIds}
              busyPlaceId={busyPlaceId}
              detailsLoadingId={detailsLoadingId}
              preferenceDraft={preferenceDraft}
              preferenceLoading={preferenceLoading}
              preferenceSaving={preferenceSaving}
              preferenceMessage={preferenceMessage}
              preferenceError={preferenceError}
              mobileView={mobileView}
              onRadiusChange={updateRadius}
              onMobileViewChange={setMobileView}
              onUseCurrentLocation={useCurrentLocation}
              onRetrySearch={() => { if (coordinates) void loadRecommendations(session.access_token, coordinates, radius); }}
              onSavePreferences={savePreferences}
              onRetryPreferences={() => void loadPreference(session.access_token)}
              onTogglePurpose={togglePurpose}
              onUpdatePreference={updatePreference}
              onOpenDetails={(cafe) => void openDetails(cafe)}
              onSave={(cafe) => void toggleFavorite(cafe)}
              onLike={(cafe) => void toggleLike(cafe)}
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
              onLike={(cafe) => void toggleLike(cafe)}
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
              email={session.user.email}
              onRequestSignOut={() => { setLogoutError(""); setLogoutDialogOpen(true); }}
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

      {selectedCafe && <CafeDetailDialog token={session.access_token} cafe={selectedCafe} isSaved={savedIds.includes(selectedCafe.placeId)} isLiked={likedIds.includes(selectedCafe.placeId)} busy={busyPlaceId === selectedCafe.placeId} onClose={() => setSelectedCafe(null)} onSave={() => void toggleFavorite(selectedCafe)} onLike={() => void toggleLike(selectedCafe)} onVisited={() => void performInteraction(selectedCafe, "VISITED")} />}
      {logoutDialogOpen && <LogoutDialog busy={logoutBusy} error={logoutError} onCancel={() => setLogoutDialogOpen(false)} onConfirm={() => void confirmSignOut()} />}
    </main>
  );
}
