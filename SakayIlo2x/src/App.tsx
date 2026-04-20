import React, { useState, useEffect } from 'react';
import MapRouter from './components/MapRouter';
import SearchBottomSheet from './components/SearchBottomSheet';
import { RouteResult as EngineRouteResult, calculateCommute } from './lib/routingEngine';
import { loadRoutes } from './dataLoader';

const App: React.FC = () => {
  const [routeOptions, setRouteOptions] = useState<EngineRouteResult[] | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<EngineRouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routesData, setRoutesData] = useState<any>(null);
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

    try {
      const maxWalkingDistance = 800; // or get from some state
      const results = calculateCommute(origin, dest, routesData, maxWalkingDistance);

      if (Array.isArray(results) && results.length > 0) {
        setRouteOptions(results as EngineRouteResult[]);
      } else {
        // null or error
        setRouteOptions(null);
        if (results && 'error' in results) {
          alert(results.error);
        } else {
          alert("No route found.");
        }
      }
      setSelectedRoute(null);
      setOriginCoords(origin);
      setDestCoords(dest);
    } catch (e) {
      console.error(e);
      alert("Failed to calculate route");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100 font-sans text-gray-800">
      {/* Background Map Layer */}
      <div className="absolute inset-0 z-0">
        <MapRouter
          selectedRoute={selectedRoute}
          originCoords={originCoords}
          destCoords={destCoords}
        />
      </div>

      {/* Foreground UI Layer (Two panels) */}
      <div className="absolute top-0 left-0 w-full md:w-[28rem] h-full pointer-events-none z-10 flex flex-col p-4 md:p-6 gap-4">
        <SearchBottomSheet
          onCalculateRoute={handleCalculateRoute}
          isLoading={isLoading}
          routeOptions={routeOptions}
          selectedRoute={selectedRoute}
          onSelectRoute={setSelectedRoute}
        />
      </div>
    </div>
  );
};

export default App;
