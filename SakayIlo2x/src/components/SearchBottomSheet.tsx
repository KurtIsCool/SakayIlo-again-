import React, { useState } from 'react';
import { Crosshair } from 'lucide-react';
import { MapPin } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export interface RouteResult {
  id: string;
  type: string; // e.g. '1 Ride: Direct', '2 Rides: Transfer'
  description: string;
}

export interface SearchBottomSheetProps {
  onSearch?: (originCoords: [number, number], destCoords: [number, number]) => void;
  isLoading?: boolean;
  results?: RouteResult[] | null;
  onLocateOrigin?: (setCoords: (coords: [number, number]) => void) => void;
  onPinOrigin?: (setCoords: (coords: [number, number]) => void) => void;
  onPinDestination?: (setCoords: (coords: [number, number]) => void) => void;
}

const SearchBottomSheet: React.FC<SearchBottomSheetProps> = ({
  onSearch,
  isLoading: externalIsLoading = false,
  results = null,
  onLocateOrigin,
  onPinOrigin,
  onPinDestination,
}) => {
  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [localIsLoading, setLocalIsLoading] = useState(false);

  const isLoading = externalIsLoading || localIsLoading;

  const handleSearch = () => {
    setLocalIsLoading(true);

    // Validate that both origin and destination coordinates are available
    if (!originCoords || !destCoords) {
      alert("Please select both origin and destination coordinates first.");
      setLocalIsLoading(false);
      return;
    }

    if (onSearch) {
      // -------------------------------------------------------------------------------------------------
      // !!! PLUG IN ENGINE HERE !!!
      // You should execute your calculateCommute engine function inside the onSearch callback provided
      // by the parent component (e.g., App.tsx). Pass the validated originCoords and destCoords below.
      // E.g., `const result = calculateCommute(originCoords, destCoords, routesData, 800);`
      // -------------------------------------------------------------------------------------------------
      onSearch(originCoords, destCoords);
    }

    setLocalIsLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-[2rem] shadow-xl border-2 border-gray-100 p-6 flex flex-col gap-4 font-sans">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Where do you want to go?</h2>

      {/* Origin Input */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase text-gray-500">Origin</label>
        <div className="relative w-full">
          <input
            type="text"
            className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl py-3 pl-4 pr-20 text-gray-800 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            placeholder="Enter origin"
            value={originText}
            onChange={(e) => setOriginText(e.target.value)}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              onClick={() => onLocateOrigin && onLocateOrigin(setOriginCoords)}
              className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors"
              title="Use my location"
            >
              <Crosshair size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => onPinOrigin && onPinOrigin(setOriginCoords)}
              className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors"
              title="Choose on map"
            >
              <MapPin size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Destination Input */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase text-gray-500">Destination</label>
        <div className="relative w-full">
          <input
            type="text"
            className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl py-3 pl-4 pr-12 text-gray-800 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            placeholder="Enter destination"
            value={destinationText}
            onChange={(e) => setDestinationText(e.target.value)}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            <button
              onClick={() => onPinDestination && onPinDestination(setDestCoords)}
              className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors"
              title="Choose on map"
            >
              <MapPin size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4">
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className={`w-full py-4 rounded-2xl font-extrabold text-white text-lg flex items-center justify-center gap-2 transition-all
            ${isLoading
              ? 'bg-emerald-400 cursor-not-allowed border-b-0 translate-y-1'
              : 'bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1'
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              Loading...
            </>
          ) : (
            'What to ride?'
          )}
        </button>
      </div>

      {/* Results View */}
      {results && results.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Route Options</h3>
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-white border-2 border-gray-200 rounded-2xl p-4 hover:border-emerald-500 transition-colors cursor-pointer flex flex-col gap-1"
            >
              <span className="font-extrabold text-gray-800">{result.type}</span>
              <span className="text-gray-600 text-sm font-medium">{result.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBottomSheet;
