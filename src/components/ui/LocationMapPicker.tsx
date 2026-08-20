"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DrawingManager, GoogleMap, MarkerF, Polygon, useJsApiLoader, type Libraries } from "@react-google-maps/api";
import Button from "./Button";
import appSettings from "@/lib/appSettings";
import { useTranslation } from "@/store/hooks";
import styles from "./LocationMapPicker.module.scss";

// Stable reference required by useJsApiLoader — a new array literal on every render would make it
// think the script needs reloading with different libraries. "drawing" is what unlocks
// DrawingManager/google.maps.drawing.OverlayType below, for the plot boundary tool.
const LIBRARIES: Libraries = ["drawing"];

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

export interface LatLngPoint {
  lat: number;
  lng: number;
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
  /** The plot's own boundary polygon — see models/Asset.ts's `boundary`. Omit entirely on pickers that don't need it (e.g. Realtor address). */
  boundary?: LatLngPoint[];
  onBoundaryChange?: (points: LatLngPoint[]) => void;
}

export default function LocationMapPicker({
  latitude,
  longitude,
  onLocationChange,
  fallbackAddress,
  addressQuery,
  alwaysFollowAddress = false,
  boundary,
  onBoundaryChange,
}: LocationMapPickerProps) {
  const t = useTranslation();
  const { isLoaded, loadError } = useJsApiLoader({
    id: "webrealtor-google-maps-script",
    googleMapsApiKey: appSettings.googleMapsApiKey,
    libraries: LIBRARIES,
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

  const boundaryPoints = useMemo(() => boundary ?? [], [boundary]);
  const boundaryCentroid = useMemo(() => {
    if (boundaryPoints.length === 0) return null;
    const sum = boundaryPoints.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
    return { lat: sum.lat / boundaryPoints.length, lng: sum.lng / boundaryPoints.length };
  }, [boundaryPoints]);

  const position = useMemo(() => {
    if (hasPosition) return { lat: parsedLat, lng: parsedLng };
    if (boundaryCentroid) return boundaryCentroid;
    if (fallbackCenter) return fallbackCenter;
    return DEFAULT_CENTER;
  }, [hasPosition, parsedLat, parsedLng, boundaryCentroid, fallbackCenter]);

  const zoom = hasPosition ? SELECTED_ZOOM : boundaryCentroid ? SELECTED_ZOOM : fallbackCenter ? REALTOR_FALLBACK_ZOOM : DEFAULT_ZOOM;

  // Plot boundary drawing — see CLAUDE.md → "Asset management". Only active when the caller opted
  // in via onBoundaryChange (AssetDetail); pickers that don't pass it (none today, but the prop is
  // optional) render the marker-only picker unchanged.
  const [isDrawingBoundary, setIsDrawingBoundary] = useState(false);
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  const syncBoundaryFromPolygon = useCallback(() => {
    const polygon = polygonRef.current;
    if (!polygon || !onBoundaryChange) return;
    const path = polygon.getPath().getArray();
    onBoundaryChange(path.map((latLng) => ({ lat: latLng.lat(), lng: latLng.lng() })));
  }, [onBoundaryChange]);

  const handlePolygonComplete = useCallback(
    (polygon: google.maps.Polygon) => {
      const path = polygon.getPath().getArray();
      onBoundaryChange?.(path.map((latLng) => ({ lat: latLng.lat(), lng: latLng.lng() })));
      // The DrawingManager's own overlay is replaced by our controlled <Polygon> below (driven from
      // the boundary prop) the moment the parent re-renders with the new points — remove this raw
      // one now so the two don't briefly double up.
      polygon.setMap(null);
      setIsDrawingBoundary(false);
    },
    [onBoundaryChange]
  );

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (isDrawingBoundary || !event.latLng) return;
      applyPosition(event.latLng.lat(), event.latLng.lng());
    },
    [applyPosition, isDrawingBoundary]
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

          {onBoundaryChange && (
            <DrawingManager
              drawingMode={isDrawingBoundary ? google.maps.drawing.OverlayType.POLYGON : null}
              onPolygonComplete={handlePolygonComplete}
              options={{
                drawingControl: false,
                polygonOptions: {
                  fillColor: "#004261",
                  fillOpacity: 0.18,
                  strokeColor: "#004261",
                  strokeWeight: 2,
                  clickable: false,
                  editable: false,
                  zIndex: 1,
                },
              }}
            />
          )}

          {onBoundaryChange && boundaryPoints.length > 0 && !isDrawingBoundary && (
            <Polygon
              path={boundaryPoints}
              draggable
              editable
              options={{ fillColor: "#004261", fillOpacity: 0.18, strokeColor: "#004261", strokeWeight: 2 }}
              onLoad={(polygon) => {
                polygonRef.current = polygon;
              }}
              onUnmount={() => {
                polygonRef.current = null;
              }}
              onMouseUp={syncBoundaryFromPolygon}
              onDragEnd={syncBoundaryFromPolygon}
            />
          )}
        </GoogleMap>
      </div>
      <div className={styles.footer}>
        <p className={styles.hint}>
          {isDrawingBoundary
            ? t("media.boundaryDrawingHint")
            : onBoundaryChange && boundaryPoints.length > 0
              ? t("media.boundarySavedHint")
              : hasPosition
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

      {onBoundaryChange && (
        <div className={styles.boundaryControls}>
          {isDrawingBoundary ? (
            <Button type="button" variant="ghost" onClick={() => setIsDrawingBoundary(false)}>
              {t("media.cancelBoundary")}
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => setIsDrawingBoundary(true)}>
              {boundaryPoints.length > 0 ? t("media.redrawBoundary") : t("media.drawBoundary")}
            </Button>
          )}
          {boundaryPoints.length > 0 && !isDrawingBoundary && (
            <Button type="button" variant="ghost" onClick={() => onBoundaryChange([])}>
              {t("media.clearBoundary")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
