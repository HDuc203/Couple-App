import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/lib/profile";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/onboarding/profile";

  if (token_hash && type) {
    const supabase = await createClient();

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

      redirect(next);
    }
  }

  // Redirect to login page with error message if verification fails
  redirect("/login?error=Xác nhận email thất bại hoặc link đã hết hạn.");
}
