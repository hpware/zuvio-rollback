"use client";

import dynamic from "next/dynamic";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  onClick: (latlng: { lat: number; lng: number }) => void;
  position?: [number, number];
  children?: React.ReactNode;
}

function LocationMarker({
  onClick,
}: {
  onClick: (latlng: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

export default function MapComponent({
  center,
  zoom,
  onClick,
  position,
  children,
}: MapComponentProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{
        height: "400px",
        width: "100%",
        borderRadius: "0.5rem",
        boxShadow:
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onClick={onClick} />
      {position && <Marker position={position} />}
      <Marker position={center} />
      {children}
    </MapContainer>
  );
}
