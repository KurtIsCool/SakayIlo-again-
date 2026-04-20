import React, { useRef, useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import type { Marker as LMarker } from 'leaflet';

interface LocationPickerMapProps {
  initialPosition?: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialPosition = [10.722, 122.556],
  onPositionChange,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const markerRef = useRef<LMarker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition([newPos.lat, newPos.lng]);
          onPositionChange(newPos.lat, newPos.lng);
        }
      },
    }),
    [onPositionChange],
  );

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  return (
    <MapContainer center={initialPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={position}
        ref={markerRef}
      >
      </Marker>
    </MapContainer>
  );
};

export default LocationPickerMap;
