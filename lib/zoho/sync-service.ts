import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { getZohoClient, ZohoNotConfiguredError } from "@/lib/zoho/client";
import { categorizeZohoItem } from "@/lib/zoho/item-categorizer";

export interface SyncResult {
  success: boolean;
  skipped: boolean;
  items_synced: number;
  items_created: number;
  items_updated: number;
  items_deactivated: number;
  errors: string[];
}

interface ZohoItemsListResponse {
  items: Array<{
    item_id: string;
    name: string;
    item_type?: string;
    status?: string;
    rate: number;
    description?: string;
  }>;
  page_context?: { has_more_page?: boolean };
}

// Doc §5.3 lines 1107-1212, adapted:
// - Takes a SupabaseClient (the admin client) instead of constructing one
//   from raw env vars, matching every other lib/ function in this repo.
// - Catches ZohoNotConfiguredError up front and returns a `skipped` result
//   with a zoho_sync_log row instead of throwing — this is the function the
//   plan's graceful-degradation requirement is really about.
// - syncPricingFromMappings/syncAddonsFromMappings are gap-fills: the doc
//   calls them but never defines them. Implemented here by matching
//   zoho_item_mapping rows to local pricing/addons rows via zoho_item_id
//   (both tables already store it from the seed data — see doc §3.2) and
//   updating price/name/description when the Zoho rate changed.
export async function syncZohoItems(
  supabase: SupabaseClient<Database>,
  triggeredBy: string = "manual"
): Promise<SyncResult> {
  const { data: syncLog } = await supabase
    .from("zoho_sync_log")
    .insert({ sync_type: "items", status: "running", triggered_by: triggeredBy })
    .select()
    .single();

  const result: SyncResult = {
    success: true,
    skipped: false,
    items_synced: 0,
    items_created: 0,
    items_updated: 0,
    items_deactivated: 0,
    errors: [],
  };

  try {
    const zoho = await getZohoClient();

    let page = 1;
    let hasMore = true;
    const allItems: ZohoItemsListResponse["items"] = [];

    while (hasMore) {
      const response = await zoho.get<ZohoItemsListResponse>("/items", {
        params: { page, per_page: 200 },
      });
      allItems.push(...response.data.items);
      hasMore = response.data.page_context?.has_more_page ?? false;
      page++;
    }

    const { data: existingMappings } = await supabase.from("zoho_item_mapping").select("*");
    const existingMap = new Map((existingMappings ?? []).map((m) => [m.zoho_item_id, m]));

    for (const item of allItems) {
      const itemHash = crypto
        .createHash("sha256")
        .update(JSON.stringify({ name: item.name, rate: item.rate, status: item.status }))
        .digest("hex");

      const existing = existingMap.get(item.item_id);
      const category = categorizeZohoItem(item.name);

      if (!existing) {
        await supabase.from("zoho_item_mapping").insert({
          zoho_item_id: item.item_id,
          zoho_item_name: item.name,
          zoho_item_type: item.item_type ?? null,
          zoho_status: item.status ?? null,
          zoho_rate: item.rate,
          zoho_description: item.description ?? null,
          category: category.category,
          duration: category.duration,
          local_entity_type:
            category.category === "other" ? "unmapped" : category.category === "addon" ? "addon" : "space_pricing",
          last_synced_at: new Date().toISOString(),
          sync_hash: itemHash,
        });
        result.items_created++;
      } else if (existing.sync_hash !== itemHash) {
        await supabase
          .from("zoho_item_mapping")
          .update({
            zoho_item_name: item.name,
            zoho_status: item.status ?? null,
            zoho_rate: item.rate,
            zoho_description: item.description ?? null,
            last_synced_at: new Date().toISOString(),
            sync_hash: itemHash,
            updated_at: new Date().toISOString(),
          })
          .eq("zoho_item_id", item.item_id);
        result.items_updated++;
      }
      result.items_synced++;
    }

    await syncPricingFromMappings(supabase);
    await syncAddonsFromMappings(supabase);
  } catch (error) {
    if (error instanceof ZohoNotConfiguredError) {
      result.skipped = true;
      result.errors.push(error.message);
    } else {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }
  }

  if (syncLog?.id) {
    await supabase
      .from("zoho_sync_log")
      .update({
        status: result.skipped ? "skipped" : result.success ? "completed" : "failed",
        completed_at: new Date().toISOString(),
        items_synced: result.items_synced,
        items_created: result.items_created,
        items_updated: result.items_updated,
        error_message: result.errors.join("; ") || null,
      })
      .eq("id", syncLog.id);
  }

  return result;
}

async function syncPricingFromMappings(supabase: SupabaseClient<Database>): Promise<void> {
  const { data: mappings } = await supabase
    .from("zoho_item_mapping")
    .select("zoho_item_id, zoho_item_name, zoho_rate, zoho_description")
    .eq("local_entity_type", "space_pricing");

  for (const mapping of mappings ?? []) {
    if (mapping.zoho_rate === null) continue;
    await supabase
      .from("pricing")
      .update({
        price: mapping.zoho_rate,
        zoho_item_name: mapping.zoho_item_name,
        description: mapping.zoho_description,
      })
      .eq("zoho_item_id", mapping.zoho_item_id);
  }
}

async function syncAddonsFromMappings(supabase: SupabaseClient<Database>): Promise<void> {
  const { data: mappings } = await supabase
    .from("zoho_item_mapping")
    .select("zoho_item_id, zoho_item_name, zoho_rate")
    .eq("local_entity_type", "addon");

  for (const mapping of mappings ?? []) {
    if (mapping.zoho_rate === null) continue;
    await supabase
      .from("addons")
      .update({ price: mapping.zoho_rate, name: mapping.zoho_item_name })
      .eq("zoho_item_id", mapping.zoho_item_id);
  }
}
