import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/";
  const role = searchParams.get("role");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // If role was specified (from registration), update the profile
      if (role) {
        await supabase
          .from("profiles")
          .update({ role })
          .eq("id", data.user.id);
      }

      // Get user profile to determine redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      // Determine redirect URL
      let redirectUrl = redirect;
      if (redirect === "/" || redirect === "/api/auth/callback") {
        if (profile?.role === "supplier") {
          redirectUrl = "/supplier";
        } else if (profile?.role === "buyer") {
          redirectUrl = "/buyer";
        } else if (profile?.role === "admin") {
          redirectUrl = "/admin";
        }
      }

      return NextResponse.redirect(`${origin}${redirectUrl}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-callback-error`);
}
