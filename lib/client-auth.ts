"use client";

import { createClient } from "@/lib/supabase/client";

export async function hasSession() {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session?.user);
  } catch {
    return false;
  }
}
