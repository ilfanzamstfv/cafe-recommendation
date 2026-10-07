"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Button, Input } from "@heroui/react";
import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const signedInEmail = data.user?.email ?? email.trim();
      setSuccessMessage(`Signed in as ${signedInEmail}.`);
      window.location.replace("/");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-bold text-[#373d20]">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="email@example.com"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          variant="bordered"
          className="min-h-[52px] rounded-lg border border-[#717744]/40 bg-[#eff1ed] px-4 text-[#373d20] shadow-none outline-none placeholder:text-[#717744]/70 hover:border-[#373d20] focus:border-[#373d20] focus:ring-4 focus:ring-[#bcbd8b]/35 disabled:cursor-not-allowed disabled:opacity-70"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-bold text-[#373d20]">
          Password
        </label>
        <div className="relative flex items-center">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            variant="bordered"
            className="min-h-[52px] w-full rounded-lg border border-[#717744]/40 bg-[#eff1ed] px-4 pr-24 text-[#373d20] shadow-none outline-none placeholder:text-[#717744]/70 hover:border-[#373d20] focus:border-[#373d20] focus:ring-4 focus:ring-[#bcbd8b]/35 disabled:cursor-not-allowed disabled:opacity-70"
          />
          <button
            type="button"
            className="absolute right-2 cursor-pointer p-2"
            onClick={() => setShowPassword((current) => !current)}
            disabled={isSubmitting}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </div>

      <div className="min-h-6" aria-live="polite">
        {errorMessage ? (
          <p className="m-0 text-sm leading-6 text-[#3d0814]">{errorMessage}</p>
        ) : null}
        {successMessage ? (
          <p className="m-0 text-sm leading-6 text-[#373d20]">{successMessage}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        isDisabled={isSubmitting}
        className="w-full min-h-14 bg-[#373d20] font-semibold text-[#eff1ed] shadow-none transition hover:-translate-y-px hover:bg-[#2d3319] hover:shadow-[0_12px_26px_rgba(55,61,32,0.2)] focus:outline-none focus:ring-4 focus:ring-[#bcbd8b]/45"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
