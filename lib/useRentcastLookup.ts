"use client";

import { useEffect, useRef, useState } from "react";

// Normalized shape returned by /api/property-lookup (see app/api/property-lookup/route.ts).
export type RentcastResult = {
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

type LookupState = {
  data: RentcastResult | null;
  loading: boolean;
  error: string | null;
};

const DEBOUNCE_MS = 700;
const MIN_LENGTH = 8; // don't fire on a half-typed address

/**
 * Debounced Rentcast lookup keyed off a free-text address.
 *
 * - Waits DEBOUNCE_MS after the user stops typing, then fetches once.
 * - `enabled` lets the caller gate fetching (e.g. only while the modal is open).
 * - Stale responses are dropped if the address changed mid-flight.
 * - On any failure it sets `error` and leaves `data` null — callers should fall
 *   back to manual input and never block the user. It never throws.
 */
export function useRentcastLookup(address: string, enabled = true): LookupState {
  const [state, setState] = useState<LookupState>({
    data: null,
    loading: false,
    error: null,
  });

  // Tracks the latest request so out-of-order responses are ignored.
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = address.trim();

    if (!enabled || trimmed.length < MIN_LENGTH) {
      // Reset to idle without firing a request.
      setState((s) =>
        s.loading || s.data || s.error
          ? { data: null, loading: false, error: null }
          : s
      );
      return;
    }

    const id = ++requestIdRef.current;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await fetch(
          `/api/property-lookup?address=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        const json = await res.json();
        if (id !== requestIdRef.current) return; // superseded by a newer query

        if (!res.ok) {
          setState({ data: null, loading: false, error: json.error ?? "Lookup failed" });
          return;
        }
        setState({ data: json as RentcastResult, loading: false, error: null });
      } catch (e) {
        if (controller.signal.aborted || id !== requestIdRef.current) return;
        setState({
          data: null,
          loading: false,
          error: "Couldn't reach the property data service.",
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [address, enabled]);

  return state;
}
