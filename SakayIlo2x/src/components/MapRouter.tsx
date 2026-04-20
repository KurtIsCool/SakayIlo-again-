import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteResult, calculateCommute } from '../lib/routingEngine';
import { loadRoutes } from '../dataLoader';
import SearchBottomSheet from './SearchBottomSheet';
import RouteResultsPanel from './RouteResultsPanel';

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

const DEFAULT_CENTER: [number, number] = [10.706, 122.558]; // Iloilo City center roughly

export default function MapRouter() {
  const [routesData, setRoutesData] = useState<any>(null);

  // Master State
  const [routeOptions, setRouteOptions] = useState<RouteResult[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    loadRoutes().then(data => {
      setRoutesData(data);
    });
  }, []);

  const handleCalculateRoute = (origin: [number, number], dest: [number, number]) => {
    if (!routesData) {
      alert("Routes data is still loading, please try again in a moment.");
      return;
    }

    setIsLoading(true);
    setOriginCoords(origin);
    setDestCoords(dest);

    try {
      const maxWalkingDistance = 800; // default for now
      const results = calculateCommute(origin, dest, routesData, maxWalkingDistance);

      if (Array.isArray(results) && results.length > 0) {
        setRouteOptions(results as RouteResult[]);
      } else {
        setRouteOptions([]);
        if (results && 'error' in results) {
          alert(results.error);
        } else {
          alert("No route found.");
        }
      }
      setSelectedRoute(null);
    } catch (e) {
      console.error(e);
      alert("Failed to calculate route");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setRouteOptions([]);
    setSelectedRoute(null);
  };

  return (
    <>
      <div className="absolute inset-0 z-0">
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
          {selectedRoute && selectedRoute.pathGeoJSON && selectedRoute.pathGeoJSON.features.map((feature: any, i: number) => {
            const positions = feature.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);

            const mode = feature.properties?.mode;
            let color = '#000000';
            let weight = 6;
            let dashArray = undefined;

            if (mode === 'walk') {
              color = '#9ca3af';
              weight = 4;
              dashArray = '5, 10';
            } else if (mode === 'jeep') {
              color = feature.properties?.color || '#000000';
              weight = 6;
            } else if (mode === 'transfer') {
              color = '#3B82F6';
              weight = 3;
              dashArray = '2, 5';
            }

            return (
              <Polyline
                key={`computed-route-${i}`}
                positions={positions}
                pathOptions={{ color, weight, opacity: 0.8, dashArray }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* Foreground UI Layer */}
      <div className="absolute top-0 left-0 w-full md:w-[28rem] h-full pointer-events-none z-10 flex flex-col p-4 md:p-6 gap-4">
        <SearchBottomSheet
          onCalculateRoute={handleCalculateRoute}
          isLoading={isLoading}
        />
        <RouteResultsPanel
          routeOptions={routeOptions}
          selectedRoute={selectedRoute}
          onSelectRoute={(route) => setSelectedRoute(route)}
          onClear={handleClear}
        />
      </div>
    </>
  );
}
