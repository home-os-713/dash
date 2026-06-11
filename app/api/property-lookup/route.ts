// Proxy to Rentcast API (rentcast.io) — the working alternative to Zillow's
// defunct public API. Requires RENTCAST_API_KEY in env vars.
// Rentcast free tier: 50 requests/month; sign up at https://app.rentcast.io
//
// Caching (two layers):
//   1. Durable, app-level DB cache (`rentcast_cache`, migration 003), keyed by
//      normalized address. Shared across all users; survives redeploys and the
//      delete/re-add of a property. This is the primary quota saver — a cached
//      address never hits Rentcast again.
//   2. unstable_cache (30 days, in-memory per deployment) around the live fetch,
//      as a secondary same-deploy dedup layer.
// Dev mode: returns mock data instantly — no API key, credits, or DB needed.
//
// Returns a normalized shape consumed by the add/edit property modals to
// pre-fill prop_val (estimatedValue) and rent (rentEstimate), plus address
// metadata (city/state/zip), value/rent ranges, and facts (beds/baths/sqft/…).

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type LookupResult = {
  estimatedValue: number | null;
  priceRangeLow: number | null;
  priceRangeHigh: number | null;
  rentEstimate: number | null;
  rentRangeLow: number | null;
  rentRangeHigh: number | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  yearBuilt: number | null;
  propertyType: string | null;
};

const DEV_MOCK: LookupResult = {
  estimatedValue: 485000,
  priceRangeLow: 460000,
  priceRangeHigh: 510000,
  rentEstimate: 2650,
  rentRangeLow: 2400,
  rentRangeHigh: 2900,
  city: "Phoenix",
  state: "AZ",
  zipCode: "85001",
  bedrooms: 3,
  bathrooms: 2,
  squareFootage: 1450,
  yearBuilt: 2005,
  propertyType: "Single Family",
};

// One canonical key per address so partial/variant strings don't fragment the cache.
function normalizeAddress(address: string): string {
  return address.trim().toLowerCase().replace(/\s+/g, " ");
}

// rentcast_cache row (snake_case) → API response (camelCase).
function rowToResult(row: Record<string, unknown>): LookupResult {
  const n = (v: unknown) => (v == null ? null : Number(v));
  const s = (v: unknown) => (v == null ? null : String(v));
  return {
    estimatedValue: n(row.estimated_value),
    priceRangeLow: n(row.price_range_low),
    priceRangeHigh: n(row.price_range_high),
    rentEstimate: n(row.rent_estimate),
    rentRangeLow: n(row.rent_range_low),
    rentRangeHigh: n(row.rent_range_high),
    city: s(row.city),
    state: s(row.state),
    zipCode: s(row.zip_code),
    bedrooms: n(row.bedrooms),
    bathrooms: n(row.bathrooms),
    squareFootage: n(row.square_footage),
    yearBuilt: n(row.year_built),
    propertyType: s(row.property_type),
  };
}

// API response → rentcast_cache row, including the normalized address key.
function resultToRow(key: string, r: LookupResult): Record<string, unknown> {
  return {
    address: key,
    estimated_value: r.estimatedValue,
    price_range_low: r.priceRangeLow,
    price_range_high: r.priceRangeHigh,
    rent_estimate: r.rentEstimate,
    rent_range_low: r.rentRangeLow,
    rent_range_high: r.rentRangeHigh,
    city: r.city,
    state: r.state,
    zip_code: r.zipCode,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    square_footage: r.squareFootage,
    year_built: r.yearBuilt,
    property_type: r.propertyType,
  };
}

const fetchFromRentcast = unstable_cache(
  async (address: string): Promise<LookupResult> => {
    const apiKey = process.env.RENTCAST_API_KEY!;
    const headers = { "X-Api-Key": apiKey, Accept: "application/json" };
    const encoded = encodeURIComponent(address);

    // Three Rentcast endpoints in parallel:
    //  - /properties     → property facts (beds, baths, sqft, address parts)
    //  - /avm/value      → estimated sale value (Zestimate equivalent)
    //  - /avm/rent/long-term → estimated long-term monthly rent
    const [propRes, avmRes, rentRes] = await Promise.all([
      fetch(`https://api.rentcast.io/v1/properties?address=${encoded}&limit=1`, {
        headers,
      }),
      fetch(`https://api.rentcast.io/v1/avm/value?address=${encoded}`, { headers }),
      fetch(`https://api.rentcast.io/v1/avm/rent/long-term?address=${encoded}`, {
        headers,
      }),
    ]);

    let propData: Record<string, unknown>[] = [];
    let avmData: Record<string, unknown> = {};
    let rentData: Record<string, unknown> = {};

    // Each endpoint degrades independently — a failure on one (e.g. no rent
    // comps for the address) still lets the others populate their fields.
    if (propRes.ok) propData = await propRes.json();
    if (avmRes.ok) avmData = await avmRes.json();
    if (rentRes.ok) rentData = await rentRes.json();

    const prop = propData[0] ?? {};

    return {
      estimatedValue: (avmData.price as number) ?? null,
      priceRangeLow: (avmData.priceRangeLow as number) ?? null,
      priceRangeHigh: (avmData.priceRangeHigh as number) ?? null,
      rentEstimate: (rentData.rent as number) ?? null,
      rentRangeLow: (rentData.rentRangeLow as number) ?? null,
      rentRangeHigh: (rentData.rentRangeHigh as number) ?? null,
      city: (prop.city as string) ?? null,
      state: (prop.state as string) ?? null,
      zipCode: (prop.zipCode as string) ?? null,
      bedrooms: (prop.bedrooms as number) ?? null,
      bathrooms: (prop.bathrooms as number) ?? null,
      squareFootage: (prop.squareFootage as number) ?? null,
      yearBuilt: (prop.yearBuilt as number) ?? null,
      propertyType: (prop.propertyType as string) ?? null,
    };
  },
  ["rentcast-lookup"],
  { revalidate: 60 * 60 * 24 * 30 } // 30 days
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return Response.json({ error: "address is required" }, { status: 400 });
  }

  // Local dev never calls the real API or DB — returns the fixed mock instantly.
  if (process.env.NODE_ENV !== "production") {
    return Response.json(DEV_MOCK);
  }

  const key = normalizeAddress(address);

  // 1. Durable app-level cache. A hit means zero Rentcast calls. If the table
  //    doesn't exist yet (migration 003 not run), this throws and we fall
  //    through to a live fetch — caching is an optimization, never a hard dep.
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  try {
    supabase = await createClient();
    const { data: cached } = await supabase
      .from("rentcast_cache")
      .select("*")
      .eq("address", key)
      .maybeSingle();
    if (cached) return Response.json(rowToResult(cached));
  } catch {
    // Cache unavailable — proceed to live fetch.
  }

  // 2. Cache miss → live Rentcast fetch (requires the key).
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "RENTCAST_API_KEY not configured" },
      { status: 503 }
    );
  }

  try {
    const data = await fetchFromRentcast(address);
    // Store for next time (fire-and-forget; ignore errors like a missing table).
    if (supabase) {
      void supabase
        .from("rentcast_cache")
        .upsert(resultToRow(key, data), { onConflict: "address" })
        .then(() => {}, () => {});
    }
    return Response.json(data);
  } catch {
    // Never crash the caller — the modals fall back to manual entry on error.
    return Response.json({ error: "Rentcast lookup failed" }, { status: 502 });
  }
}
