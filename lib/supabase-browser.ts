"use client";
import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = "https://mpciqgiykgoizsklmkhz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wY2lxZ2l5a2dvaXpza2xta2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NDI5NzMsImV4cCI6MjA5ODQxODk3M30.p7PcreJZVLtXzjrzMVAGc001ZV_VpsxLjAYwzXBY9fc";

export function supabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
