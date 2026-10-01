import { createBrowserClient } from "@supabase/ssr";

const REMEMBER_ME_KEY = "accmarket_remember_me";
const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30;

export function createClient() {
  const rememberMe =
    typeof window !== "undefined"
      ? localStorage.getItem(REMEMBER_ME_KEY) !== "false"
      : true;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: rememberMe
        ? {
            maxAge: REMEMBER_ME_MAX_AGE,
          }
        : undefined,
    }
  );
}