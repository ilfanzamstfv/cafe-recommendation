import Image from "next/image";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login | Cafe Recommendation",
  description: "Sign in to Cafe Recommendation.",
};

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-[#eff1ed] text-[#373d20]">
      <section
        className="grid min-h-dvh grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)]"
        aria-label="Cafe Recommendation login"
      >
        <div className="relative order-2 min-h-[260px] overflow-hidden bg-[#373d20] sm:min-h-[320px] lg:order-1 lg:min-h-dvh">
          <Image
            src="/images/login-1.jpg"
            alt="Cafe table with coffee prepared for a quiet visit"
            fill
            priority
            sizes="(max-width: 860px) 100vw, 48vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(55,61,32,0.08),rgba(55,61,32,0.74)),linear-gradient(90deg,rgba(55,61,32,0.44),rgba(55,61,32,0.06))]" />
          <div className="absolute inset-x-6 bottom-7 text-[#eff1ed] sm:inset-x-10 sm:bottom-10 lg:inset-x-14 lg:bottom-14">
            <h1 className="m-0 mt-3 max-w-[12ch] text-[clamp(2.2rem,8vw,4.7rem)] font-bold leading-none tracking-normal text-white lg:text-[clamp(3.1rem,5vw,5.2rem)]">
              Find cafés that match you.
            </h1>
            <p className="m-0 mt-5 max-w-xl text-lg leading-7 text-[#bcbd8b]/90 italic">
              Explore places that fit your location, pace, and coffee plans.
            </p>
          </div>
        </div>

        <div className="order-1 flex min-h-[66dvh] items-center bg-white px-5 py-10 sm:px-10 lg:order-2 lg:min-h-dvh lg:px-14">
          <div className="mx-auto w-full max-w-107.5">
            <div className="flex items-center">
              <Image
                src="/images/logo.png"
                alt="Cafinity"
                width={56}
                height={56}
                className="size-14 shrink-0 object-contain"
              />
              <p
                className="m-0 text-3xl leading-none text-[#3d0814]"
                style={{ fontFamily: "Lobster, cursive" }}
              >
                Cafinity
              </p>
            </div>
            <div className="mb-8 mt-8">
              <h2 className="m-0 text-[clamp(2.1rem,7vw,3.15rem)] font-bold leading-tight tracking-normal text-[#373d20]">
                Welcome back
              </h2>
              <p className="m-0 mt-3 text-base leading-7 text-[#717744]">
                Sign in with your email and password to continue.
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
