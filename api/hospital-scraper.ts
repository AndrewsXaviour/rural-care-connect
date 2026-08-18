import type { VercelRequest, VercelResponse } from "@vercel/node";

const AWS_API_KEY = process.env.AWS_LOCATION_SERVICE_API_KEY;
const AWS_REGION = "us-east-1";
const HOSPITAL_KEYWORDS = ["hospital", "medical", "clinic", "health", "nursing"];

interface AWSPlaceResult {
  Distance?: number;
  Place?: {
    Label?: string;
    Geometry?: { Point?: [number, number] };
    Categories?: string[];
  };
}

interface AWSSearchResponse {
  Results?: AWSPlaceResult[];
}

interface HospitalResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const indexName = (process.env.AWS_PLACES_INDEX || "").trim();

  if (!AWS_API_KEY || !indexName) {
    return res.status(500).json({
      error: "AWS Location Service not configured on server",
      configured: false,
    });
  }

  try {
    const { latitude, longitude, radiusKm = 50 } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    // Validate coordinate ranges
    if (typeof latitude !== "number" || typeof longitude !== "number" ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    // Validate coordinate ranges
    if (typeof latitude !== "number" || typeof longitude !== "number" ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    const url = `https://places.geo.${AWS_REGION}.amazonaws.com/places/v0/indexes/${encodeURIComponent(indexName)}/search/position?key=${encodeURIComponent(AWS_API_KEY)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Position: [longitude, latitude],
        MaxResults: 50,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`AWS Location Service error (${response.status}):`, errorText);
      return res.status(response.status).json({
        error: `AWS API returned ${response.status}`,
        configured: true,
      });
    }

    const data: AWSSearchResponse = await response.json();
    const results = data.Results ?? [];
    const hospitals: HospitalResult[] = [];
    const existingIds = new Set<string>();

    for (const result of results) {
      const place = result.Place;
      if (!place?.Geometry?.Point) continue;

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

    return res.status(200).json({ hospitals, configured: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("AWS Location proxy error:", message);
    return res.status(500).json({ error: "Failed to fetch hospitals" });
  }
}
