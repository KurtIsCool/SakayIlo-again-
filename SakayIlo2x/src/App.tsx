import React, { useState } from 'react';
import { useEffect } from 'react';
import MapRouter from './components/MapRouter';
import SearchBottomSheet, { RouteResult } from './components/SearchBottomSheet';
import { RouteResult as EngineRouteResult, calculateCommute } from './lib/routingEngine';
import { loadRoutes } from './dataLoader';

const App: React.FC = () => {
  const [routeResult, setRouteResult] = useState<EngineRouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routesData, setRoutesData] = useState<any>(null);

  useEffect(() => {
    loadRoutes().then(data => {
      setRoutesData(data);
    });
  }, []);

  // Map routing engine result to the UI component result format
  const mappedResults: RouteResult[] | null = routeResult && !('error' in routeResult) ? [
    {
      id: '1',
      type: routeResult.type === 'direct' ? '1 Ride: Direct' : '2 Rides: Transfer',
      description: `Total Distance: ${Math.round(routeResult.totalDistance)}m`,
    }
  ] : null;

  const handleRouteResult = (result: EngineRouteResult | null) => {
    setRouteResult(result);
    setIsLoading(false);
  };

  const handleCalculateRoute = (originCoords: [number, number], destCoords: [number, number]) => {
    if (!routesData) {
      alert("Routes data is still loading, please try again in a moment.");
      return;
    }

    setIsLoading(true);

    try {
      const maxWalkingDistance = 800; // or get from some state
      const result = calculateCommute(originCoords, destCoords, routesData, maxWalkingDistance);
      setRouteResult(result as EngineRouteResult);
    } catch (e) {
      console.error(e);
      setRouteResult({ error: "Failed to calculate route" } as any);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100 font-sans text-gray-800">
      {/* Background Map Layer */}
      <div className="absolute inset-0 z-0">
        <MapRouter onRouteResult={handleRouteResult} maxWalkingDistance={800} />
      </div>

      {/* Foreground UI Layer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-8 md:p-6 md:pb-10 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md mx-auto">
          <SearchBottomSheet
            onCalculateRoute={handleCalculateRoute}
            isLoading={isLoading}
            results={mappedResults}
            onLocateOrigin={(setCoords) => {
              console.log('Locate origin');
              setCoords([10.706, 122.558]);
            }}
            onPinOrigin={(setCoords) => {
              console.log('Pin origin');
              setCoords([10.722, 122.556]);
            }}
            onPinDestination={(setCoords) => {
              console.log('Pin destination');
              setCoords([10.6974, 122.5644]);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
