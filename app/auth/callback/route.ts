import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getPublicOrigin(request: Request, url: URL) {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configuredOrigin) return configuredOrigin;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;

  return url.origin;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") || "/explore";
  const next = nextParam.startsWith("/") ? nextParam : "/explore";

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase?.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, getPublicOrigin(request, url)));
}
