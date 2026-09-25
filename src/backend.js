import { createClient } from "@supabase/supabase-js";
import { publicConfig } from "./public-config.js";
const offline = import.meta.env.MODE === "test";
const url = offline
  ? null
  : import.meta.env.VITE_SUPABASE_URL || publicConfig.url;
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  publicConfig.key;
export const db = url && key ? createClient(url, key) : null;
export async function checked(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
export async function catalog() {
  return Promise.all([
    checked(
      db.from("nr_products").select("*").eq("active", true).order("sort_order"),
    ),
    checked(
      db.from("nr_variants").select("*").eq("active", true).order("weight_g"),
    ),
    checked(db.from("nr_shipping").select("*").eq("active", true)),
  ]);
}
export async function isAdmin() {
  return db ? Boolean(await checked(db.rpc("nr_is_admin"))) : false;
}
export async function placePreview(lines, address, requestId) {
  return checked(
    db.rpc("nr_place_preview_order", {
      p_lines: lines,
      p_address: address,
      p_request_id: requestId,
    }),
  );
}
