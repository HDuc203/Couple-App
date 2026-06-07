import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ensureProfileForUser } from "@/lib/profile";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/onboarding/profile";

  // Create the redirect response first
  let response = NextResponse.redirect(`${origin}${next}`);

  if (token_hash && type) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Ensure the profile is created for the authenticated user
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await ensureProfileForUser(supabase, user);
        }
      } catch (profileError) {
        console.error("Profile creation error in confirmation handler:", profileError);
      }

      return response;
    }
  }

  // Redirect to login page with error message if verification fails
  return NextResponse.redirect(`${origin}/login?error=Xác nhận email thất bại hoặc link đã hết hạn.`);
}
