"use client";

import { useEffect, useRef, useState } from "react";
import { loadPlacesLib, mapsConfigured } from "@/lib/maps";

export type SelectedAddress = {
  /** Clean, formatted street address (Google's formatted_address). */
  address: string;
  /** "City, ST" derived from address components, if available. */
  location: string | null;
  lat: number | null;
  lng: number | null;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Fired when the user picks a suggestion — gives clean address + parsed parts. */
  onSelect?: (selected: SelectedAddress) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

/**
 * Address input with Google Places autocomplete.
 *
 * Drop-in replacement for a plain <input>: same value/onChange contract, same
 * className. When a suggestion is chosen, `onSelect` fires with a cleaned
 * address plus parsed city/state and coordinates.
 *
 * Degrades gracefully — if the Maps key is missing or the SDK fails to load,
 * it behaves as an ordinary text input (no autocomplete, never crashes).
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  id,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Keep the latest callbacks in refs so the Places listener (bound once) always
  // calls the current closures without re-binding on every render.
  const onChangeRef = useRef(onChange);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onChangeRef.current = onChange;
    onSelectRef.current = onSelect;
  });

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapsConfigured) return;
    let cancelled = false;
    let autocomplete: google.maps.places.Autocomplete | null = null;

    loadPlacesLib().then((places) => {
      if (cancelled || !places || !inputRef.current) return;

      autocomplete = new places.Autocomplete(inputRef.current, {
        types: ["address"],
        fields: ["formatted_address", "address_components", "geometry"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete!.getPlace();
        const formatted = place.formatted_address ?? inputRef.current?.value ?? "";

        // Derive "City, ST" from address components when present.
        let city: string | null = null;
        let state: string | null = null;
        for (const comp of place.address_components ?? []) {
          if (comp.types.includes("locality")) city = comp.long_name;
          if (comp.types.includes("postal_town") && !city) city = comp.long_name;
          if (comp.types.includes("administrative_area_level_1")) {
            state = comp.short_name;
          }
        }
        const location = city && state ? `${city}, ${state}` : city ?? null;

        const loc = place.geometry?.location;
        onChangeRef.current(formatted);
        onSelectRef.current?.({
          address: formatted,
          location,
          lat: loc ? loc.lat() : null,
          lng: loc ? loc.lng() : null,
        });
      });

      setReady(true);
    });

    return () => {
      cancelled = true;
      // Detach listeners on unmount (google global exists once the SDK loaded).
      if (autocomplete && typeof window !== "undefined" && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

  return (
    <input
      ref={inputRef}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      // Disable the browser's own autofill so it doesn't fight the Places dropdown.
      data-maps-ready={ready ? "true" : undefined}
      className={className}
    />
  );
}
