"use client";

import type { FormEventHandler } from "react";
import type { PricePreference, Purpose, UserPreference } from "@/types/cafe";
import { priceLabels, purposeOptions } from "@/features/dashboard/constants";
import { SkeletonRows } from "@/features/dashboard/shared";

type ProfileTabProps = {
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
    <section className="max-w-2xl">
      <div className="mb-6 border-b border-[#bcbd8b]/70 pb-5">
        <p className="mb-2 text-sm font-semibold text-[#717744]">Make recommendations more relevant</p>
        <h1 className="m-0 text-3xl font-bold sm:text-4xl">Your preferences</h1>
      </div>
      {loading && <SkeletonRows kind="form" />}
      {error && <p role="alert" className="mb-4 text-sm text-[#3d0814]">{error} <button type="button" onClick={onRetry} className="font-semibold underline">Try again</button></p>}
      {preferenceDraft && !loading && (
        <form onSubmit={onSave} className="space-y-6">
          <label className="grid gap-2 text-sm font-semibold">
            Preferred distance
            <select value={preferenceDraft.maxDistanceKm} onChange={(event) => onUpdatePreference("maxDistanceKm", Number(event.target.value))} className="min-h-12 rounded-md border border-[#717744]/40 bg-white px-3 font-normal outline-none focus:border-[#373d20] focus:ring-2 focus:ring-[#bcbd8b]">
              {[1, 3, 5, 10].map((value) => <option key={value} value={value}>{value} km</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Minimum rating
            <select value={preferenceDraft.minimumRating} onChange={(event) => onUpdatePreference("minimumRating", Number(event.target.value))} className="min-h-12 rounded-md border border-[#717744]/40 bg-white px-3 font-normal outline-none focus:border-[#373d20] focus:ring-2 focus:ring-[#bcbd8b]">
              {[4, 4.2, 4.5].map((value) => <option key={value} value={value}>{value.toFixed(1)} and above</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Preferred price
            <select value={preferenceDraft.preferredPrice} onChange={(event) => onUpdatePreference("preferredPrice", event.target.value as PricePreference)} className="min-h-12 rounded-md border border-[#717744]/40 bg-white px-3 font-normal outline-none focus:border-[#373d20] focus:ring-2 focus:ring-[#bcbd8b]">
              {(Object.keys(priceLabels) as PricePreference[]).map((value) => <option key={value} value={value}>{priceLabels[value]}</option>)}
            </select>
          </label>
          <fieldset className="border-0 p-0">
            <legend className="mb-3 text-sm font-semibold">What are you looking for?</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {purposeOptions.map(({ value, label }) => (
                <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors ${preferenceDraft.purposes.includes(value) ? "border-[#373d20] bg-[#bcbd8b]/35 font-semibold" : "border-[#717744]/30 bg-white"}`}>
                  <input type="checkbox" checked={preferenceDraft.purposes.includes(value)} onChange={() => onTogglePurpose(value)} className="size-4 accent-[#373d20]" />{label}
                </label>
              ))}
            </div>
          </fieldset>
          {message && <p role="status" className="m-0 text-sm font-semibold text-[#373d20]">{message}</p>}
          <button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#373d20] px-5 text-sm font-semibold text-white hover:bg-[#4a5230] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717744] focus-visible:ring-offset-2 disabled:opacity-60">{saving ? "Saving..." : "Save preferences"}</button>
        </form>
      )}
    </section>
  );
}
