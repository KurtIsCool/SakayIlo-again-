# Coordinate Translation Strategy Report

## Analysis: The Single Translation Layer Philosophy

Establishing a strict "Coordinate Boundary" at the entry point of the routing engine (and similarly, at the boundaries of UI components) is significantly better than performing random coordinate swaps deeper inside the system for several key reasons:

1.  **Elimination of Silent Failures:** When swapping happens deep inside logic loops, it's very easy to accidentally swap twice or forget to swap once, resulting in `[lng, lat]` being passed to Leaflet, rendering lines "in the ocean" near the equator instead of the correct location. A single layer guarantees all internal state uses one standard.
2.  **Separation of Concerns:** The routing engine (`routingEngine.ts`) heavily relies on Turf.js, which strictly requires `[lng, lat]` (GeoJSON standard). The UI (`MapRouter.tsx`) heavily relies on Leaflet, which strictly requires `[lat, lng]`. By establishing a boundary, the internal logic of the routing engine never has to "think" about Leaflet, and the UI never has to think about GeoJSON.
3.  **Testability:** When testing `routingEngine.ts`, you can reliably know what shape the inputs and outputs should take without needing to trace down where the coordinate swap happens internally.

## Type Safety Strategy: Opaque Types / Tagged Types

In TypeScript, both `LeafletLatLng` and `TurfPosition` are conceptually `[number, number]`. By default, TypeScript cannot differentiate between `[lat, lng]` and `[lng, lat]` because they are structurally identical.

We can solve this using "Branded Types" or "Opaque Types" to prevent accidental cross-assignment. However, for a simpler, pragmatic approach that avoids casting everywhere, we can use semantic type aliasing coupled with dedicated translation utilities.

```typescript
// SakayIlo2x/src/lib/coordinates.ts

// Semantic aliases
export type LeafletLatLng = [number, number]; // [Latitude, Longitude]
export type TurfPosition = [number, number];  // [Longitude, Latitude]

/**
 * Converts Leaflet [lat, lng] to Turf/GeoJSON [lng, lat]
 */
export function toTurfPosition(latLng: LeafletLatLng): TurfPosition {
  return [latLng[1], latLng[0]];
}

/**
 * Converts Turf/GeoJSON [lng, lat] to Leaflet [lat, lng]
 */
export function toLeafletLatLng(position: TurfPosition): LeafletLatLng {
  return [position[1], position[0]];
}
```
*Note: If developers want strict enforcement, they could use nominal typing: `type LeafletLatLng = [number, number] & { __brand: 'Leaflet' }`, but the alias + utility functions approach is often sufficient if strictly adopted.*

## Actionable Refactor: Where else to enforce this?

To make the app completely bulletproof, we need to enforce this standard wherever data crosses between the "Leaflet World" and the "GeoJSON/Turf World".

**1. `src/lib/routingEngine.ts`**
*   **Current State:** Swaps coordinates internally when making `startPt` and `endPt`.
*   **Fix:** Use the explicit utilities at the API entry point.
```typescript
import { LeafletLatLng, toTurfPosition } from './coordinates';

export function calculateCommute(
  startLatLng: LeafletLatLng,
  endLatLng: LeafletLatLng,
  // ...
) {
  const startPt = turf.point(toTurfPosition(startLatLng));
  // ...
}
```

**2. `src/components/MapRouter.tsx`**
*   **Current State:** Contains inline ad-hoc swaps like `feature.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number])`.
*   **Fix:** Replace ad-hoc maps with explicit calls to `toLeafletLatLng`. Apply the `LeafletLatLng` type to state variables.
```typescript
import { LeafletLatLng, toLeafletLatLng } from '../lib/coordinates';

// Master State
const [originCoords, setOriginCoords] = useState<LeafletLatLng | null>(null);

// Inside render...
{routesData && routesData.features.map((feature: any, idx: number) => {
  const coords = feature.geometry.coordinates.map((c: any) => toLeafletLatLng(c));
  // ...
})}
```

**3. `src/components/LocationPickerMap.tsx`**
*   **Current State:** Uses raw `[number, number]`.
*   **Fix:** Enforce `LeafletLatLng`.
```typescript
import { LeafletLatLng } from '../lib/coordinates';

interface LocationPickerMapProps {
  initialPosition?: LeafletLatLng;
  // ...
}
```
