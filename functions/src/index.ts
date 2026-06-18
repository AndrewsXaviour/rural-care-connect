import * as functions from "firebase-functions";
import axios from "axios";
import cors from "cors";

// Initialize CORS middleware
const corsHandler = cors({ origin: true });

export const fetchGoogleHospitals = functions.https.onCall(async (data, context) => {
  // We can wrap the whole thing to handle CORS if accessed via HTTP, 
  // but onCall handles CORS automatically.
  
  const { latitude, longitude, radiusMeters = 50000 } = data;

  if (!latitude || !longitude) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Latitude and longitude are required parameters."
    );
  }

  // Get the Google Places API key from environment variables
  // In production, this usually comes from functions.config() or process.env depending on setup
  // For V2/V1, we can use process.env.GOOGLE_PLACES_API_KEY
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Google Places API key is not configured on the server."
    );
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusMeters}&type=hospital&key=${apiKey}`;
    
    // Make the backend request to Google Places API
    const response = await axios.get(url);

    if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
      throw new Error(`Google API returned status: ${response.data.status}`);
    }

    // Transform the data securely on the backend before sending back to client
    interface GooglePlace {
      place_id: string;
      name: string;
      vicinity?: string;
      geometry: { location: { lat: number; lng: number } };
    }
    const hospitals = response.data.results?.map((place: GooglePlace) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity || "Address not available",
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
    })) || [];

    return { hospitals };
  } catch (error: unknown) {
    console.error("Error fetching from Google Places:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while fetching hospitals from Google Places."
    );
  }
});
