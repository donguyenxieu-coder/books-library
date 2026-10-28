import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

// cache(): trong cùng một request, header và page cùng gọi hàm này
// thì chỉ query Supabase một lần.
export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();

  // getClaims() xác thực JWT trong cookie (không tin mù quáng như getSession()).
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("id", userId)
    .single();

  return profile;
});

export type CurrentProfile = NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>>;
