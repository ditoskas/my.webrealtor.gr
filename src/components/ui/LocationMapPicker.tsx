"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import appSettings from "@/lib/appSettings";
import { useTranslation } from "@/store/hooks";
import styles from "./LocationMapPicker.module.scss";

// Athens, Greece — the last-resort starting view when a listing has no coordinates yet and no
// realtor address could be geocoded either.
const DEFAULT_CENTER = { lat: 37.9838, lng: 23.7275 };
const DEFAULT_ZOOM = 6;
const REALTOR_FALLBACK_ZOOM = 15;
const SELECTED_ZOOM = 16;

// Debounce for geocoding the listing's own address fields as the user types them.
const ADDRESS_GEOCODE_DEBOUNCE_MS = 800;

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

// Small house pin, inlined as an SVG data URI so no extra asset/request is needed.
const HOUSE_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
  <path d="M18 3 L33 16 H28 V33 H21 V22 H15 V33 H8 V16 H3 Z" fill="#004261" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
</svg>
`.trim();

function buildGoogleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

interface LocationMapPickerProps {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: number, lng: number, mapsUrl: string) => void;
  /** Centers the map (with a closer zoom) before any location has been picked yet — typically the selected realtor's address. */
  fallbackAddress?: string;
  /** The listing's own composed address (country/region/city/street/...) — geocoded (debounced) to place the marker as the user fills it in, until a position has been picked. */
  addressQuery?: string;
  /** Keep re-geocoding addressQuery and moving the marker on every change, even after a position has been picked — for the "insert" (create) form, where the address is the source of truth. Defaults to false (edit-safe: stop following once a position exists, so it can't silently override a manually fine-tuned or previously-saved pin). */
  alwaysFollowAddress?: boolean;
}

export default function LocationMapPicker({
  latitude,
  longitude,
  onLocationChange,
  fallbackAddress,
  addressQuery,
  alwaysFollowAddress = false,
}: LocationMapPickerProps) {
  const t = useTranslation();
  const { isLoaded, loadError } = useJsApiLoader({
    id: "webrealtor-google-maps-script",
    googleMapsApiKey: appSettings.googleMapsApiKey,
  });

  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  useEffect(() => {
    if (!isLoaded) return;
    geocoderRef.current = new google.maps.Geocoder();
  }, [isLoaded]);

  const parsedLat = Number(latitude);
  const parsedLng = Number(longitude);
  const hasPosition = latitude !== "" && longitude !== "" && !Number.isNaN(parsedLat) && !Number.isNaN(parsedLng);

  const applyPosition = useCallback(
    (lat: number, lng: number) => {
      onLocationChange(lat, lng, buildGoogleMapsUrl(lat, lng));
    },
    [onLocationChange]
  );

  // Nothing picked yet — center on the realtor's address (closer zoom) instead of the country-wide default.
  const [fallbackCenter, setFallbackCenter] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!isLoaded || hasPosition || !fallbackAddress?.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFallbackCenter(null);
      return;
    }
    geocoderRef.current?.geocode({ address: fallbackAddress }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const location = results[0].geometry.location;
        setFallbackCenter({ lat: location.lat(), lng: location.lng() });
      }
    });
  }, [isLoaded, hasPosition, fallbackAddress]);

  // Follow the listing's own address fields as the user fills them in, so the marker lands roughly
  // in the right place and can be dragged from there to fine-tune. Off the "insert" form
  // (alwaysFollowAddress), this stops once a real position exists (from this, a click, or a drag)
  // so further address edits can't silently override a manually fine-tuned or previously-saved
  // pin; on the insert form it keeps following every address change, since there's nothing to
  // protect yet and the address is the source of truth until the listing is first saved.
  useEffect(() => {
    if (!isLoaded || (hasPosition && !alwaysFollowAddress) || !addressQuery?.trim()) return;
    const timeout = setTimeout(() => {
      geocoderRef.current?.geocode({ address: addressQuery }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const location = results[0].geometry.location;
          applyPosition(location.lat(), location.lng());
        }
      });
    }, ADDRESS_GEOCODE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [isLoaded, hasPosition, alwaysFollowAddress, addressQuery, applyPosition]);

  const position = useMemo(() => {
    if (hasPosition) return { lat: parsedLat, lng: parsedLng };
    if (fallbackCenter) return fallbackCenter;
    return DEFAULT_CENTER;
  }, [hasPosition, parsedLat, parsedLng, fallbackCenter]);

  const zoom = hasPosition ? SELECTED_ZOOM : fallbackCenter ? REALTOR_FALLBACK_ZOOM : DEFAULT_ZOOM;

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      applyPosition(event.latLng.lat(), event.latLng.lng());
    },
    [applyPosition]
  );

  const handleMarkerDragEnd = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      applyPosition(event.latLng.lat(), event.latLng.lng());
    },
    [applyPosition]
  );

  if (!appSettings.googleMapsApiKey) {
    return <p className={styles.notice}>{t("media.mapApiKeyMissing")}</p>;
  }

  if (loadError) {
    return <p className={styles.notice}>{t("media.mapLoadError")}</p>;
  }

  if (!isLoaded) {
    return <p className={styles.notice}>{t("media.mapLoading")}</p>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.map}>
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={position}
          zoom={zoom}
          onClick={handleMapClick}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
        >
          <MarkerF
            position={position}
            draggable
            onDragEnd={handleMarkerDragEnd}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(HOUSE_ICON_SVG)}`,
              scaledSize: new google.maps.Size(36, 36),
              anchor: new google.maps.Point(18, 34),
            }}
          />
        </GoogleMap>
      </div>
      <div className={styles.footer}>
        <p className={styles.hint}>
          {hasPosition
            ? t("media.selectedLocation", { lat: parsedLat.toFixed(6), lng: parsedLng.toFixed(6) })
            : t("media.mapHint")}
        </p>
        {hasPosition && (
          <a
            href={buildGoogleMapsUrl(parsedLat, parsedLng)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.externalLink}
          >
            {t("media.openInGoogleMaps")}
          </a>
        )}
      </div>
    </div>
  );
}
