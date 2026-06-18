import { useState, useEffect } from "react";
import { Hospital } from "@/lib/mockData";
import { calculateDistance, getUserLocation, getAddressFromCoordinates, LocationCoords } from "@/lib/location";
import { fetchHospitalsFromWeb } from "@/lib/hospitalScraper";
import { cacheHospitals, getCachedHospitals } from "@/lib/supabaseDb";

interface UseNearbyHospitalsReturn {
  hospitals: Hospital[];
  loading: boolean;
  error: string | null;
  userLocation: LocationCoords | null;
  userAddress: string;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch nearby hospitals based on user's location
 * Fetches real data from OpenStreetMap API and caches in Firebase
 */
export const useNearbyHospitals = (): UseNearbyHospitalsReturn => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");

  const fetchNearbyHospitals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's current location
      const coords = await getUserLocation();
      const location: LocationCoords = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      setUserLocation(location);

      // Get user's address from coordinates
      const address = await getAddressFromCoordinates(coords.latitude, coords.longitude);
      setUserAddress(address);

      // Try to get cached hospitals first
      const cachedHospitals = await getCachedHospitals(60); // 60 minute cache
      let fetchedHospitals: Hospital[] = [];

      if (cachedHospitals.length > 0) {
        console.log(`Using ${cachedHospitals.length} cached hospitals`);
        fetchedHospitals = (cachedHospitals as unknown as Hospital[]);
      } else {
        // Fetch fresh hospitals from web (OpenStreetMap)
        console.log("Fetching hospitals from web...");
        fetchedHospitals = await fetchHospitalsFromWeb(coords.latitude, coords.longitude, 50);

        // Cache the results
        if (fetchedHospitals.length > 0) {
          await cacheHospitals(fetchedHospitals);
        }
      }

      // Calculate distances for all hospitals
      const hospitalsWithDistance = fetchedHospitals.map((hospital) => ({
        ...hospital,
        distance: calculateDistance(
          coords.latitude,
          coords.longitude,
          hospital.latitude,
          hospital.longitude
        ),
      }));

      // Sort by distance
      const sorted = hospitalsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setHospitals(sorted);
    } catch (err: unknown) {
      console.error("Location/Hospital fetch error:", err);
      const geoErr = err as { code?: number; message?: string };
      const errorMessage =
        geoErr.code === 1
          ? "Location access denied. Please enable location permissions."
          : geoErr.code === 2
            ? "Unable to retrieve your location. Please try again."
            : geoErr.code === 3
              ? "Location request timed out. Please try again."
              : geoErr.message || "Unable to fetch hospitals";

      setError(errorMessage);

      // Fall back to empty list
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyHospitals();
  }, []);

  return {
    hospitals,
    loading,
    error,
    userLocation,
    userAddress,
    refetch: fetchNearbyHospitals,
  };
};
