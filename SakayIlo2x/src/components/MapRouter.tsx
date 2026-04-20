import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateCommute, RouteResult } from '../lib/routingEngine';
// Remove import, using fetch now
// import { iloiloRoutes } from '../data/iloiloRoutes';
import { loadRoutes } from '../dataLoader';

// Fix typical leaflet icon issue in react
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icons for Start and End
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapRouterProps {
  onRouteResult: (result: RouteResult | null) => void;
  maxWalkingDistance: number;
}

const DEFAULT_CENTER: [number, number] = [10.706, 122.558]; // Iloilo City center roughly

function DraggableMarker({
  position,
  setPosition,
  icon,
  label
}: {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  icon: L.Icon;
  label: string;
}) {
  const markerRef = React.useRef<L.Marker>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          setPosition([latLng.lat, latLng.lng]);
        }
      },
    }),
    [setPosition],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      icon={icon}
      ref={markerRef}
    >
      <Popup minWidth={90}>
        <strong>{label}</strong> <br/> Drag to change.
      </Popup>
    </Marker>
  );
}

export default function MapRouter({ onRouteResult, maxWalkingDistance }: MapRouterProps) {
  const [startPos, setStartPos] = useState<[number, number]>([10.722, 122.556]); // Jaro Plaza
  const [endPos, setEndPos] = useState<[number, number]>([10.6974, 122.5644]); // Plaza Libertad
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routesData, setRoutesData] = useState<any>(null);

  useEffect(() => {
    loadRoutes().then(data => {
      setRoutesData(data);
    });
  }, []);

  // Re-calculate route when start/end/walking distance changes
  // useEffect(() => {
  //   if (!routesData) return;
  //   // Note: routing engine expects [lat, lng]
  //   const result = calculateCommute(startPos, endPos, routesData, maxWalkingDistance);
  //   setRouteResult(result as RouteResult);
  //   onRouteResult(result as RouteResult);
  // }, [startPos, endPos, maxWalkingDistance, routesData, onRouteResult]);

  return (
    <MapContainer center={DEFAULT_CENTER} zoom={14} scrollWheelZoom={true} className="w-full h-full rounded-xl shadow-inner z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Background jeepney routes mapping */}
      {routesData && routesData.features.map((feature: any, idx: number) => {
        const coords = feature.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
        return (
          <Polyline 
            key={`bg-route-${idx}`} 
            positions={coords} 
            pathOptions={{ color: feature.properties.color, weight: 3, opacity: 0.3, dashArray: '5, 10' }} 
          />
        );
      })}

      <DraggableMarker position={startPos} setPosition={setStartPos} icon={startIcon} label="Start Point" />
      <DraggableMarker position={endPos} setPosition={setEndPos} icon={endIcon} label="End Destination" />

      {/* Render the computed route segments if found */}
      {routeResult && routeResult.pathGeoJSON && routeResult.pathGeoJSON.features.map((f, i) => {
        const coords = f.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);

        const mode = f.properties?.mode;
        let color = '#000000';
        let weight = 6;
        let dashArray = undefined;

        if (mode === 'walk') {
          color = '#6B7280';
          weight = 3;
          dashArray = '5, 10';
        } else if (mode === 'jeep') {
          color = f.properties?.color || '#000000';
          weight = 7;
        } else if (mode === 'transfer') {
          color = '#3B82F6';
          weight = 3;
          dashArray = '2, 5';
        }

        return (
          <Polyline 
            key={`computed-route-${i}`} 
            positions={coords} 
            pathOptions={{ color, weight, opacity: 0.8, dashArray }}
          />
        );
      })}
    </MapContainer>
  );
}
