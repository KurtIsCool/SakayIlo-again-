import React from 'react';
import { RouteResult } from '../lib/routingEngine';
import { X } from 'lucide-react';

interface RouteResultsPanelProps {
  routeOptions: RouteResult[];
  selectedRoute: RouteResult | null;
  onSelectRoute: (route: RouteResult) => void;
  onClear: () => void;
}

export default function RouteResultsPanel({
  routeOptions,
  selectedRoute,
  onSelectRoute,
  onClear,
}: RouteResultsPanelProps) {
  if (!routeOptions || routeOptions.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white rounded-[2rem] shadow-xl border-2 border-gray-100 p-6 flex flex-col gap-4 font-sans pointer-events-auto z-20 flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-xs font-bold uppercase text-gray-500">Route Options</h3>
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-full hover:bg-gray-100 transition-colors"
          title="Clear routes"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {routeOptions.map((option, idx) => {
        const isSelected = selectedRoute === option;
        const typeLabel = option.type === 'direct' ? '1 Ride: Direct' : '2 Rides: Transfer';
        const distance = Math.round(option.totalDistance);
        const time = Math.round(option.estimatedTravelTime);

        // Extract jeepney steps to render them properly
        const jeepneySteps = option.steps.filter((s) => s.mode === 'jeep');

        return (
          <div
            key={idx}
            onClick={() => onSelectRoute(option)}
            className={`border-2 rounded-2xl p-4 transition-all cursor-pointer flex flex-col gap-2
              ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-emerald-300'
              }`}
          >
            <div className="flex justify-between items-center">
              <span className={`font-extrabold ${isSelected ? 'text-emerald-700' : 'text-gray-800'}`}>
                {typeLabel}
              </span>
              <span className="text-sm font-bold text-gray-500">{time} min</span>
            </div>

            <div className="flex flex-col gap-1 mt-1">
              {jeepneySteps.map((step, stepIdx) => (
                <div key={stepIdx} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: step.color || '#000' }}
                  />
                  {/* Displaying the route property (jeepney name) */}
                  <span className="text-sm font-bold text-gray-700">{step.route}</span>
                </div>
              ))}
            </div>

            <div className="text-xs font-medium text-gray-500 mt-1">
              Distance: {distance}m
            </div>
          </div>
        );
      })}
    </div>
  );
}
