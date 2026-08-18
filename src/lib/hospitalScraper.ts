import type { Hospital } from "@/lib/mockData";
import { mockHospitals } from "@/lib/mockData";
import { calculateDistance } from "@/lib/location";

// ---------------------------------------------------------------------------
// Hospital Scraper — calls our serverless proxy (api/hospital-scraper.ts)
// API key is kept server-side, never exposed to the client bundle.
// ---------------------------------------------------------------------------

/**
 * Fetch hospitals near a location via our serverless AWS Location proxy.
 * Falls back to Overpass API (free, no key needed) if proxy is unavailable.
 */
export const fetchHospitalsFromAWS = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<Hospital[]> => {
  try {
    const response = await fetch("/api/hospital-scraper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, radiusKm }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `Hospital proxy returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.configured) {
      // AWS not configured on server — fall through to Overpass
      return fetchHospitalsFromOverpassAPI(latitude, longitude, radiusKm);
    }

    return data.hospitals as Hospital[];
  } catch {
    return fetchHospitalsFromOverpassAPI(latitude, longitude, radiusKm);
  }
};

// ---------------------------------------------------------------------------
// OpenStreetMap Overpass API (free fallback — no API key required)
// ---------------------------------------------------------------------------

export const fetchHospitalsFromOverpassAPI = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<Hospital[]> => {
  const hospitals: Hospital[] = [];

  try {
    const overpassQuery = `
      [bbox:${latitude - radiusKm / 111},${longitude - radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))},${latitude + radiusKm / 111},${longitude + radiusKm / (111 * Math.cos((latitude * Math.PI) / 180))}];
      (
        node["amenity"="hospital"];
        way["amenity"="hospital"];
        relation["amenity"="hospital"];
      );
      out center;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return hospitals;
    }

    const data = await response.json();
    const existingIds = new Set<string>();

    interface OverpassElement {
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }

    data.elements?.forEach((element: OverpassElement, index: number) => {
      if (element.center || (element.lat && element.lon)) {
        const lat = element.center?.lat || element.lat;
        const lon = element.center?.lon || element.lon;
        const name = element.tags?.name || `Hospital ${index + 1}`;
        const address =
          element.tags?.["addr:street"] || element.tags?.["addr:city"] || "Address not available";

        const newId = `osm-${element.id}`;
        if (!existingIds.has(newId)) {
          hospitals.push({ id: newId, name, address, latitude: lat, longitude: lon });
          existingIds.add(newId);
        }
      }
    });

    return hospitals;
  } catch {
    return hospitals;
  }
};

// ---------------------------------------------------------------------------
// Combined entry point: AWS proxy first, Overpass fallback
// ---------------------------------------------------------------------------

export const fetchHospitalsFromWeb = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<Hospital[]> => {
  const awsHospitals = await fetchHospitalsFromAWS(latitude, longitude, radiusKm);
  if (awsHospitals.length > 0) {
    return awsHospitals;
  }

  const overpassHospitals = await fetchHospitalsFromOverpassAPI(latitude, longitude, radiusKm);
  if (overpassHospitals.length > 0) {
    return overpassHospitals;
  }

  // Final fallback: return mock hospitals with computed distance from user's location
  console.log("External APIs unavailable — falling back to regional hospital data");
  return mockHospitals
    .map((h) => ({
      ...h,
      distance: calculateDistance(latitude, longitude, h.latitude, h.longitude),
    }))
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
};
