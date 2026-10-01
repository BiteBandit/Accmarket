"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        setLoading(false);
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = displayName.trim();

      // 1. Check if email already exists in profiles
      const { data: existingEmail } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (existingEmail) {
        setErrorMsg("An account with this email address is already registered.");
        setLoading(false);
        return;
      }

      // 2. Check if username already exists in profiles
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (existingUser) {
        setErrorMsg("This display name is already taken. Please choose another.");
        setLoading(false);
        return;
      }

      // 3. Sign up with Supabase Auth (Metadata passes username automatically to the trigger)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: cleanUsername,
            username: cleanUsername,
          },
        },
      });

      if (signUpError) {
        setErrorMsg(signUpError.message);
        setLoading(false);
        return;
      }

      if (data?.user && data.user.identities && data.user.identities.length === 0) {
        setErrorMsg("An account with this email address has already been registered.");
        setLoading(false);
        return;
      }

      setSuccessMsg("Account created successfully! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);

    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="accmarket-grid min-h-screen bg-[#fdfdfc] text-[#111111]">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">

          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/images/logo.png"
                alt="AccMarket"
                width={170}
                height={55}
                priority
                className="h-auto w-[170px] object-contain"
              />
            </Link>
          </div>

          {/* Signup Card */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8">

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-[24px] font-bold tracking-tight text-[#111111]">
                Create your account
              </h1>

              <p className="mt-1.5 text-sm text-[#6b7280]">
                Get started with AccMarket
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="mb-6 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* Success Message Alert */}
            {successMsg && (
              <div className="mb-6 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700 border border-emerald-200">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">

              {/* Display Name */}
              <div>
                <label
                  htmlFor="displayName"
                  className="mb-2 block text-sm font-medium text-[#111111]"
                >
                  Display name
                </label>

                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  autoComplete="name"
                  className="h-12 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0b1e5b] focus:ring-4 focus:ring-[#0b1e5b]/5"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#111111]"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0b1e5b] focus:ring-4 focus:ring-[#0b1e5b]/5"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[#111111]"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-12 w-full rounded-xl border border-[#e5e7eb] bg-white px-4 pr-16 text-sm text-[#111111] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0b1e5b] focus:ring-4 focus:ring-[#0b1e5b]/5"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6b7280] transition hover:text-[#0b1e5b]"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-[#0b1e5b] text-sm font-semibold text-white transition hover:bg-[#162d78] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 border-t border-[#e5e7eb] pt-6 text-center">
              <p className="text-sm text-[#6b7280]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#0b1e5b] hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Terms */}
          <p className="mx-auto mt-5 max-w-[360px] text-center text-[11px] leading-5 text-[#9ca3af]">
            By creating an account, you agree to our{" "}
            <Link
              href="/terms"
              className="font-medium text-[#0b1e5b] hover:underline"
            >
              Terms of Service
            </Link>
            .
          </p>

          {/* Back Home */}
          <div className="mt-5 text-center">
            <Link
              href="/"
              className="text-xs font-medium text-[#6b7280] transition hover:text-[#0b1e5b]"
            >
              ← Back to AccMarket
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
