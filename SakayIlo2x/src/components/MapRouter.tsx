import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteResult } from '../lib/routingEngine';
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
  selectedRoute: RouteResult | null;
  originCoords: [number, number] | null;
  destCoords: [number, number] | null;
}

const DEFAULT_CENTER: [number, number] = [10.706, 122.558]; // Iloilo City center roughly

export default function MapRouter({ selectedRoute, originCoords, destCoords }: MapRouterProps) {
  const [routesData, setRoutesData] = useState<any>(null);

  useEffect(() => {
    loadRoutes().then(data => {
      setRoutesData(data);
    });
  }, []);

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

      {originCoords && <Marker position={originCoords} icon={startIcon}><Popup minWidth={90}><strong>Origin</strong></Popup></Marker>}
      {destCoords && <Marker position={destCoords} icon={endIcon}><Popup minWidth={90}><strong>Destination</strong></Popup></Marker>}

      {/* Render the computed route segments if found */}
      {selectedRoute && selectedRoute.pathGeoJSON && selectedRoute.pathGeoJSON.features.map((f: any, i: number) => {
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
