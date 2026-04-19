import React, { useState } from 'react';
import MapRouter from './components/MapRouter';
import SearchBottomSheet, { RouteResult } from './components/SearchBottomSheet';
import { RouteResult as EngineRouteResult } from './lib/routingEngine';

const App: React.FC = () => {
  const [routeResult, setRouteResult] = useState<EngineRouteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSearch = (origin: string, destination: string) => {
    setIsLoading(true);
    // Real map markers update would happen here based on search strings
    // For now, MapRouter uses its internal state and draggable markers.
    // We simulate a loading state before results appear.
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
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
            onSearch={handleSearch}
            isLoading={isLoading}
            results={mappedResults}
            onLocateOrigin={() => console.log('Locate origin')}
            onPinOrigin={() => console.log('Pin origin')}
            onPinDestination={() => console.log('Pin destination')}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
