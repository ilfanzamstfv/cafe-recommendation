"use client";

import type { FormEventHandler } from "react";
import { UserRound } from "lucide-react";
import type { PricePreference, Purpose, UserPreference } from "@/types/cafe";
import { priceLabels, purposeOptions } from "@/features/dashboard/constants";
import { SkeletonRows } from "@/features/dashboard/shared";

type ProfileTabProps = {
  email: string | undefined;
  preferenceDraft: UserPreference | null;
  loading: boolean;
  saving: boolean;
  message: string;
  error: string;
  onSave: FormEventHandler<HTMLFormElement>;
  onRetry: () => void;
  onTogglePurpose: (purpose: Purpose) => void;
  onUpdatePreference: <K extends keyof UserPreference>(key: K, value: UserPreference[K]) => void;
};

export function ProfileTab({
  email,
  preferenceDraft,
  loading,
  saving,
  message,
  error,
  onSave,
  onRetry,
  onTogglePurpose,
  onUpdatePreference,
}: ProfileTabProps) {
  return (
    <section className="mx-auto max-w-2xl">
      <article className="overflow-hidden rounded-lg border border-[#bcbd8b]/70 bg-white">
        <header className="border-b border-[#bcbd8b]/70 px-5 py-6 text-center sm:px-8 sm:py-7">
          <h1 className="m-0 text-2xl font-bold">Profile</h1>
          <div className="mt-5 flex flex-col items-center">
            <div aria-hidden="true" className="mb-3 grid size-20 place-items-center rounded-full border-2 border-[#373d20] bg-[#eff1ed] text-[#373d20]">
              <UserRound size={32} strokeWidth={1.8} />
            </div>
            <p className="m-0 text-sm font-medium text-[#717744]">Signed in as</p>
            <p className="mb-0 mt-1 max-w-full break-all text-base font-semibold text-[#373d20]">{email || "Email not available"}</p>
          </div>
        </header>

        <section className="p-5 sm:p-8" aria-labelledby="profile-preferences-title">
          <div className="mb-5 border-b border-[#bcbd8b]/70 pb-4">
            <h2 id="profile-preferences-title" className="m-0 text-xl font-bold">Cafe preferences</h2>
          </div>
          {loading && <div role="status" aria-label="Loading preferences"><SkeletonRows kind="form" /><span className="sr-only">Loading preferences</span></div>}
          {error && <p role="alert" className="mb-5 rounded-md border border-[#3d0814]/20 bg-[#eff1ed] p-3 text-sm leading-6 text-[#3d0814]">{error} <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d0814]">Try again</button></p>}
          {preferenceDraft && !loading && (
            <form onSubmit={onSave} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid min-w-0 gap-2 text-sm font-semibold">
                  Preferred distance
                  <select value={preferenceDraft.maxDistanceKm} onChange={(event) => onUpdatePreference("maxDistanceKm", Number(event.target.value))} className="min-h-12 w-full rounded-md border border-[#717744]/40 bg-white px-3 font-normal outline-none focus:border-[#373d20] focus:ring-2 focus:ring-[#bcbd8b]">
                    {[1, 3, 5, 10].map((value) => <option key={value} value={value}>{value} km</option>)}
                  </select>
                </label>
                <label className="grid min-w-0 gap-2 text-sm font-semibold">
                  Minimum rating
                  <select value={preferenceDraft.minimumRating} onChange={(event) => onUpdatePreference("minimumRating", Number(event.target.value))} className="min-h-12 w-full rounded-md border border-[#717744]/40 bg-white px-3 font-normal outline-none focus:border-[#373d20] focus:ring-2 focus:ring-[#bcbd8b]">
                    {[4, 4.2, 4.5].map((value) => <option key={value} value={value}>{value.toFixed(1)} and above</option>)}
                  </select>
                </label>
                <label className="grid min-w-0 gap-2 text-sm font-semibold sm:col-span-2">
                  Preferred price
                  <select value={preferenceDraft.preferredPrice} onChange={(event) => onUpdatePreference("preferredPrice", event.target.value as PricePreference)} className="min-h-12 w-full rounded-md border border-[#717744]/40 bg-white px-3 font-normal outline-none focus:border-[#373d20] focus:ring-2 focus:ring-[#bcbd8b]">
                    {(Object.keys(priceLabels) as PricePreference[]).map((value) => <option key={value} value={value}>{priceLabels[value]}</option>)}
                  </select>
                </label>
              </div>
              <fieldset className="border-0 p-0">
                <legend className="mb-3 text-sm font-semibold">What are you looking for?</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {purposeOptions.map(({ value, label }) => (
                    <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-[#717744] ${preferenceDraft.purposes.includes(value) ? "border-[#373d20] bg-[#bcbd8b]/35 font-semibold" : "border-[#717744]/30 bg-white hover:bg-[#eff1ed]"}`}>
                      <input type="checkbox" checked={preferenceDraft.purposes.includes(value)} onChange={() => onTogglePurpose(value)} className="size-4 shrink-0 accent-[#373d20]" />{label}
                    </label>
                  ))}
                </div>
              </fieldset>
              {message && <p role="status" className="m-0 text-sm font-semibold text-[#373d20]">{message}</p>}
              <button type="submit" disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#373d20] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#4a5230] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{saving ? "Saving..." : "Save preferences"}</button>
            </form>
          )}
        </section>
      </article>
    </section>
  );
}
