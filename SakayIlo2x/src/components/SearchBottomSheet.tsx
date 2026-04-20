import React, { useState } from 'react';
import { Crosshair } from 'lucide-react';
import { MapPin } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import LocationPickerMap from './LocationPickerMap';

export interface RouteResult {
  id: string;
  type: string; // e.g. '1 Ride: Direct', '2 Rides: Transfer'
  description: string;
}

const fetchAddress = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await res.json();
    if (data.address) {
      return data.address.road || data.address.neighbourhood || (data.display_name && data.display_name.split(',')[0]) || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    }
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  } catch (err) {
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  }
};

export interface SearchBottomSheetProps {
  onCalculateRoute?: (origin: [number, number], dest: [number, number]) => void;
  isLoading?: boolean;
  results?: RouteResult[] | null;
  onLocateOrigin?: (setCoords: (coords: [number, number]) => void) => void;
  onPinOrigin?: (setCoords: (coords: [number, number]) => void) => void;
  onPinDestination?: (setCoords: (coords: [number, number]) => void) => void;
}

const SearchBottomSheet: React.FC<SearchBottomSheetProps> = ({
  onCalculateRoute,
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

  const [isLocating, setIsLocating] = useState(false);
  const [activeMapPicker, setActiveMapPicker] = useState<'origin' | 'destination' | null>(null);
  const [tempMarkerPos, setTempMarkerPos] = useState<[number, number] | null>(null);

  const isLoading = externalIsLoading || localIsLoading;

  const handleGeolocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setOriginCoords([latitude, longitude]);
        const addr = await fetchAddress(latitude, longitude);
        setOriginText(addr);
        setIsLocating(false);
      },
      (error) => {
        alert(`Error getting location: ${error.message}`);
        setIsLocating(false);
      }
    );
  };

  const handleSearch = () => {
    // Validate that both origin and destination coordinates are available
    if (!originCoords || !destCoords) {
      alert("Please select both locations.");
      return;
    }

    setLocalIsLoading(true);

    if (onCalculateRoute) {
      onCalculateRoute(originCoords, destCoords);
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
              onClick={handleGeolocation}
              className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors"
              title="Use my location"
            >
              {isLocating ? (
                <Loader2 className="animate-spin" size={20} strokeWidth={2.5} />
              ) : (
                <Crosshair size={20} strokeWidth={2.5} />
              )}
            </button>
            <button
              onClick={() => setActiveMapPicker('origin')}
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
              onClick={() => setActiveMapPicker('destination')}
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

      {/* Map Picker Modal */}
      {activeMapPicker && (
        <div className="fixed inset-0 z-[9999] bg-black/50 flex flex-col items-center justify-end animate-in fade-in duration-300 pointer-events-auto">
          <div className="bg-white w-full h-[80vh] rounded-t-[2rem] shadow-2xl flex flex-col pointer-events-auto">
            {/* Modal Header */}
            <div className="p-4 flex justify-between items-center border-b-2 border-gray-100">
              <h3 className="text-lg font-extrabold text-gray-800">
                {activeMapPicker === 'origin' ? 'Select Origin on Map' : 'Select Destination on Map'}
              </h3>
              <button
                onClick={() => {
                  setActiveMapPicker(null);
                  setTempMarkerPos(null);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold p-2"
              >
                Cancel
              </button>
            </div>

            {/* Map Placeholder */}
            <div className="flex-1 bg-gray-100 relative z-0">
              <LocationPickerMap
                initialPosition={
                  activeMapPicker === 'origin'
                    ? (originCoords || [10.722, 122.556])
                    : (destCoords || [10.722, 122.556])
                }
                onPositionChange={(lat, lng) => setTempMarkerPos([lat, lng])}
              />
            </div>

            {/* Modal Footer / Confirm Button */}
            <div className="p-6 bg-white border-t-2 border-gray-100 z-10">
              <button
                onClick={async () => {
                  const finalCoords = tempMarkerPos || (activeMapPicker === 'origin' ? originCoords : destCoords) || [10.722, 122.556];
                  const addr = await fetchAddress(finalCoords[0], finalCoords[1]);

                  if (activeMapPicker === 'origin') {
                    setOriginCoords(finalCoords);
                    setOriginText(addr);
                  } else {
                    setDestCoords(finalCoords);
                    setDestinationText(addr);
                  }
                  setActiveMapPicker(null);
                  setTempMarkerPos(null);
                }}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 rounded-2xl font-extrabold text-white text-lg border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBottomSheet;
