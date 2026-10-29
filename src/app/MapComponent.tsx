"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapClick {
  lat: number;
  lng: number;
}

interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  position?: [number, number];
  onClick?: (latlng: MapClick) => void;
  className?: string;
}

/** Custom CSS marker — no image assets, so it never 404s under Next.js. */
const markerIcon = L.divIcon({
  className: "rollcall-marker",
  html: '<span class="rollcall-marker__pulse"></span><span class="rollcall-marker__ring"></span><span class="rollcall-marker__dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function ClickHandler({
  onClick,
}: {
  onClick: (latlng: MapClick) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.panTo(e.latlng);
    },
  });
  return null;
}

function RecenterControl({ position }: { position: [number, number] }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        L.DomEvent.stopPropagation(e.nativeEvent as Event);
        map.flyTo(position, Math.max(map.getZoom(), 15));
      }}
      className="absolute right-3 top-3 z-[1000] border border-line bg-white/95 px-3 py-1.5 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-panel2"
    >
      置中
    </button>
  );
}

export default function MapComponent({
  center,
  zoom = 13,
  position,
  onClick,
  className = "h-[380px] w-full",
}: MapComponentProps) {
  return (
    <MapContainer center={center} zoom={zoom} className={className}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onClick && <ClickHandler onClick={onClick} />}
      {position && (
        <>
          <Marker position={position} icon={markerIcon} />
          <RecenterControl position={position} />
        </>
      )}
    </MapContainer>
  );
}
