"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
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
  return (
    <MapContainer
      key={`${center.latitude},${center.longitude}`}
      center={[center.latitude, center.longitude]}
      zoom={14}
      scrollWheelZoom={false}
      className="h-full w-full"
      aria-label="Map showing nearby cafés"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker
        center={[center.latitude, center.longitude]}
        radius={7}
        pathOptions={{ color: "#3d0814", fillColor: "#3d0814", fillOpacity: 1, weight: 2 }}
      >
        <Tooltip>Your location</Tooltip>
      </CircleMarker>
      {cafes.map((cafe) => (
        <CircleMarker
          key={cafe.placeId}
          center={[cafe.location.latitude, cafe.location.longitude]}
          radius={10}
          pathOptions={{ color: "#eff1ed", fillColor: "#717744", fillOpacity: 1, weight: 3 }}
          eventHandlers={{ click: () => onSelect(cafe) }}
        >
          <Tooltip direction="top">{cafe.name}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
