// Proxy to Rentcast API (rentcast.io) — the working alternative to Zillow's
// defunct public API. Requires RENTCAST_API_KEY in env vars.
// Rentcast free tier: 50 requests/month; sign up at https://app.rentcast.io
//
// Caching: results are cached 30 days per address via unstable_cache.
// Dev mode: returns mock data instantly — no API key or credits needed.

import { unstable_cache } from "next/cache";

const DEV_MOCK = {
  estimatedValue: 485000,
  priceRangeLow: 460000,
  priceRangeHigh: 510000,
  city: "Phoenix",
  state: "AZ",
  zipCode: "85001",
  bedrooms: 3,
  bathrooms: 2,
  squareFootage: 1450,
  yearBuilt: 2005,
  propertyType: "Single Family",
};

const fetchFromRentcast = unstable_cache(
  async (address: string) => {
    const apiKey = process.env.RENTCAST_API_KEY!;
    const headers = { "X-Api-Key": apiKey, Accept: "application/json" };
    const encoded = encodeURIComponent(address);

    const [propRes, avmRes] = await Promise.all([
      fetch(
        `https://api.rentcast.io/v1/properties?address=${encoded}&limit=1`,
        { headers }
      ),
      fetch(`https://api.rentcast.io/v1/avm/value?address=${encoded}`, {
        headers,
      }),
    ]);

    let propData: Record<string, unknown>[] = [];
    let avmData: Record<string, unknown> = {};

    if (propRes.ok) propData = await propRes.json();
    if (avmRes.ok) avmData = await avmRes.json();

    const prop = propData[0] ?? {};

    return {
      estimatedValue: (avmData.price as number) ?? null,
      priceRangeLow: (avmData.priceRangeLow as number) ?? null,
      priceRangeHigh: (avmData.priceRangeHigh as number) ?? null,
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

  if (process.env.NODE_ENV !== "production") {
    return Response.json(DEV_MOCK);
  }

  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "RENTCAST_API_KEY not configured" },
      { status: 503 }
    );
  }

  const data = await fetchFromRentcast(address);
  return Response.json(data);
}
