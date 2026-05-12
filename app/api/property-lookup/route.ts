// Proxy to Rentcast API (rentcast.io) — the working alternative to Zillow's
// defunct public API. Requires RENTCAST_API_KEY in env vars.
// Rentcast free tier: 50 requests/month; sign up at https://app.rentcast.io

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return Response.json({ error: "address is required" }, { status: 400 });
  }

  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "RENTCAST_API_KEY not configured" },
      { status: 503 }
    );
  }

  const headers = { "X-Api-Key": apiKey, Accept: "application/json" };
  const encoded = encodeURIComponent(address);

  // Fetch property details + AVM value in parallel
  const [propRes, avmRes] = await Promise.all([
    fetch(
      `https://api.rentcast.io/v1/properties?address=${encoded}&limit=1`,
      { headers }
    ),
    fetch(
      `https://api.rentcast.io/v1/avm/value?address=${encoded}`,
      { headers }
    ),
  ]);

  let propData: Record<string, unknown>[] = [];
  let avmData: Record<string, unknown> = {};

  if (propRes.ok) {
    propData = await propRes.json();
  }
  if (avmRes.ok) {
    avmData = await avmRes.json();
  }

  const prop = propData[0] ?? {};

  return Response.json({
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
  });
}
