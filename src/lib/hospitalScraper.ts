import { Hospital, mockHospitals } from "@/lib/mockData";
import { calculateDistance } from "@/lib/location";

// ---------------------------------------------------------------------------
// AWS Location Service Types (v1 — SearchPlaceIndexForPosition)
// ---------------------------------------------------------------------------

interface AWSPlaceResult {
  Distance?: number;
  Place?: {
    Label?: string;
    Geometry?: { Point?: [number, number] }; // [lng, lat]
    Categories?: string[];
  };
}

interface AWSSearchResponse {
  Results?: AWSPlaceResult[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const AWS_REGION = "us-east-1";
const HOSPITAL_KEYWORDS = ["hospital", "medical", "clinic", "health", "nursing"];

// ---------------------------------------------------------------------------
// AWS Location Service — REST API (no SDK credentials needed)
// ---------------------------------------------------------------------------

/**
 * Fetch hospitals near a location using AWS Location Service REST API.
 * Uses SearchPlaceIndexForPosition with API key auth via URL parameter.
 */
export const fetchHospitalsFromAWS = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<Hospital[]> => {
  const apiKey = import.meta.env.VITE_AWS_LOCATION_SERVICE_API_KEY;
  const indexName = (import.meta.env.VITE_AWS_PLACES_INDEX || "").trim();

  if (!apiKey || !indexName) {
    console.warn("AWS Location Service not configured. Falling back to Overpass API.");
    return fetchHospitalsFromOverpassAPI(latitude, longitude, radiusKm);
  }

  const hospitals: Hospital[] = [];

  // Inject premium localized mock data first
  try {
    const nearbyMocks = mockHospitals.filter(
      (h) => calculateDistance(latitude, longitude, h.latitude, h.longitude) <= radiusKm
    );
    hospitals.push(...nearbyMocks);
    if (nearbyMocks.length > 0) {
      console.log(`Injected ${nearbyMocks.length} premium localized hospitals`);
    }
  } catch (e) {
    console.warn("Could not inject mock hospital data fallback", e);
  }

  try {
    // REST API endpoint — API key passed as URL query parameter (no SDK auth needed)
    const url = `https://places.geo.${AWS_REGION}.amazonaws.com/places/v0/indexes/${encodeURIComponent(indexName)}/search/position?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Position: [longitude, latitude], // AWS uses [lng, lat]
        MaxResults: 50,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`AWS Location Service error (${response.status}):`, errorText);
      throw new Error(`AWS API returned ${response.status}`);
    }

    const data: AWSSearchResponse = await response.json();
    const results = data.Results ?? [];
    const existingIds = new Set(hospitals.map((h) => h.id));

    console.log(`AWS Location returned ${results.length} total places`);

    for (const result of results) {
      const place = result.Place;
      if (!place?.Geometry?.Point) continue;

      // Filter: check categories and label for hospital keywords
      const categoryMatch = place.Categories?.some((cat) =>
        HOSPITAL_KEYWORDS.some((kw) => cat.toLowerCase().includes(kw))
      );
      const labelMatch = HOSPITAL_KEYWORDS.some((kw) =>
        (place.Label || "").toLowerCase().includes(kw)
      );

      if (!categoryMatch && !labelMatch) continue;

      const [lng, lat] = place.Geometry.Point;
      const id = `aws-${lng.toFixed(6)}-${lat.toFixed(6)}`;
      if (existingIds.has(id)) continue;

      hospitals.push({
        id,
        name: place.Label?.split(",")[0] || "Hospital",
        address: place.Label || "Address not available",
        latitude: lat,
        longitude: lng,
        distance: result.Distance
          ? Math.round((result.Distance / 1000) * 10) / 10
          : undefined,
      });
      existingIds.add(id);
    }

    console.log(`Found ${hospitals.length} hospitals (AWS Location Service)`);
    return hospitals;
  } catch (error) {
    console.error("AWS Location Service failed, falling back to Overpass:", error);
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
    const nearbyMocks = mockHospitals.filter(
      (h) => calculateDistance(latitude, longitude, h.latitude, h.longitude) <= radiusKm
    );
    hospitals.push(...nearbyMocks);
    console.log(`Injected ${nearbyMocks.length} premium localized hospitals into search results`);
  } catch (e) {
    console.warn("Could not inject mock hospital data fallback", e);
  }

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
      console.warn("Overpass API error:", response.statusText);
      return hospitals;
    }

    const data = await response.json();
    const existingIds = new Set(hospitals.map((h) => h.id));

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

    console.log(`Found ${hospitals.length} total hospitals (Including Overpass API)`);
    return hospitals;
  } catch (error) {
    console.error("Error fetching hospitals from Overpass API:", error);
    return hospitals;
  }
};

// ---------------------------------------------------------------------------
// Combined entry point: AWS first, Overpass fallback
// ---------------------------------------------------------------------------

export const fetchHospitalsFromWeb = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<Hospital[]> => {
  if (import.meta.env.VITE_AWS_LOCATION_SERVICE_API_KEY && import.meta.env.VITE_AWS_PLACES_INDEX) {
    const awsHospitals = await fetchHospitalsFromAWS(latitude, longitude, radiusKm);
    if (awsHospitals.length > 0) {
      return awsHospitals;
    }
  }

  return fetchHospitalsFromOverpassAPI(latitude, longitude, radiusKm);
};
