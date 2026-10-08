"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import type { Cafe, Coordinates } from "@/types/cafe";

export default function CafeMap({
  center,
  cafes,
  onSelect,
}: {
  center: Coordinates;
  cafes: Cafe[];
  onSelect: (cafe: Cafe) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const locationMarkerRef = useRef<L.CircleMarker | null>(null);
  const cafesLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const centerRef = useRef(center);
  onSelectRef.current = onSelect;
  centerRef.current = center;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialCenter = centerRef.current;
    const map = L.map(container, { scrollWheelZoom: false }).setView(
      [initialCenter.latitude, initialCenter.longitude],
      14,
    );
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    locationMarkerRef.current = L.circleMarker(
      [initialCenter.latitude, initialCenter.longitude],
      { color: "#3d0814", fillColor: "#3d0814", fillOpacity: 1, weight: 2, radius: 7 },
    ).bindTooltip("Your location").addTo(map);
    cafesLayerRef.current = L.layerGroup().addTo(map);

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resizeObserver?.observe(container);

    return () => {
      resizeObserver?.disconnect();
      mapRef.current = null;
      locationMarkerRef.current = null;
      cafesLayerRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const position: L.LatLngExpression = [center.latitude, center.longitude];
    map.setView(position, map.getZoom());
    locationMarkerRef.current?.setLatLng(position);
  }, [center.latitude, center.longitude]);

  useEffect(() => {
    const layer = cafesLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    cafes.forEach((cafe) => {
      L.circleMarker(
        [cafe.location.latitude, cafe.location.longitude],
        { color: "#eff1ed", fillColor: "#717744", fillOpacity: 1, weight: 3, radius: 10 },
      )
        .bindTooltip(cafe.name, { direction: "top" })
        .on("click", () => onSelectRef.current(cafe))
        .addTo(layer);
    });
  }, [cafes]);

  return (
    <div ref={containerRef} className="h-full w-full" aria-label="Map showing nearby cafes" />
  );
}
