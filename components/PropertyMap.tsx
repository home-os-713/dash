"use client";

import { useEffect, useRef, useState } from "react";
import { loadMapLibs, mapsConfigured } from "@/lib/maps";

type Props = {
  /** Free-text address to geocode and pin. */
  address: string;
  /** Optional pre-resolved coordinates — skips geocoding when present. */
  lat?: number | null;
  lng?: number | null;
  className?: string;
};

// Minimal Snazzy-style map styling tuned to the app's warm-editorial palette.
// Light = soft cream/olive; dark = warm charcoal. Pin only — no POIs, transit,
// or road clutter, so the map reads as a calm location chip, not a busy map.
const lightStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#FAF9F6" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#78756E" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FAF9F6" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#EFEDE7" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#E2DFD6" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#F3F1EB" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#D7DBC9" }] },
];

const darkStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1F1E19" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#948F85" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#15140F" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#322F2A" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#423E36" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#211F1A" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#2A3328" }] },
];

function isDark(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

/**
 * Small, clean map pinning a property. Olive teardrop marker, no controls.
 *
 * Renders nothing (collapses) when: the Maps key is missing, the SDK fails to
 * load, or the address can't be geocoded — so the surrounding layout degrades
 * gracefully and never shows a broken/empty map box.
 */
export default function PropertyMap({ address, lat, lng, className }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Pure render-time condition: nothing to show without a key and a target.
  const hasTarget = mapsConfigured && (Boolean(address?.trim()) || lat != null);

  useEffect(() => {
    if (!hasTarget) return;
    let cancelled = false;

    loadMapLibs().then(async (libs) => {
      if (cancelled || !libs || !mapDivRef.current) {
        if (!cancelled) setFailed(true);
        return;
      }
      const { maps, marker, geocoding } = libs;

      // Resolve a position: use provided coords, else geocode the address.
      let position: google.maps.LatLngLiteral | null =
        lat != null && lng != null ? { lat, lng } : null;

      if (!position) {
        try {
          const geocoder = new geocoding.Geocoder();
          const { results } = await geocoder.geocode({ address });
          const loc = results[0]?.geometry?.location;
          if (loc) position = { lat: loc.lat(), lng: loc.lng() };
        } catch {
          position = null;
        }
      }

      if (cancelled) return;
      if (!position) {
        setFailed(true);
        return;
      }

      const map = new maps.Map(mapDivRef.current, {
        center: position,
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: "cooperative",
        clickableIcons: false,
        keyboardShortcuts: false,
        styles: isDark() ? darkStyle : lightStyle,
        // Vector basemap not required; raster + custom styles keeps it simple.
      });

      // Olive teardrop pin matching the brand accent.
      new marker.Marker({
        map,
        position,
        title: address,
        icon: {
          path: "M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z",
          fillColor: "#5A6247",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 1.5,
          scale: 1.3,
          anchor: new google.maps.Point(12, 24),
        },
      });

      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [address, lat, lng, hasTarget]);

  if (!hasTarget || failed) return null;

  return (
    <div
      className={
        className ??
        "relative w-full h-48 rounded-2xl overflow-hidden border border-line shadow-soft"
      }
    >
      <div ref={mapDivRef} className="absolute inset-0" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface">
          <div className="h-4 w-4 rounded-full border-2 border-line3 border-t-accentfg animate-spin" />
        </div>
      )}
    </div>
  );
}
