"use client";

import { LogOut, UserRound } from "lucide-react";

type ProfileTabProps = {
  email: string | undefined;
  onRequestSignOut: () => void;
};

export function ProfileTab({ email, onRequestSignOut }: ProfileTabProps) {
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

        <section className="p-5 sm:p-8">
          <button type="button" onClick={onRequestSignOut} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-red-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
            <LogOut size={17} aria-hidden="true" />Sign out
          </button>
        </section>
      </article>
    </section>
  );
}
