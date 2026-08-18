import { useQuery } from "@tanstack/react-query";
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
  refetch: () => void;
}

interface HospitalQueryResult {
  hospitals: Hospital[];
  userLocation: LocationCoords;
  userAddress: string;
}

async function fetchHospitalData(): Promise<HospitalQueryResult> {
  // Get user's current location
  const coords = await getUserLocation();
  const userLocation: LocationCoords = {
    latitude: coords.latitude,
    longitude: coords.longitude,
  };

  // Get user's address from coordinates
  const userAddress = await getAddressFromCoordinates(coords.latitude, coords.longitude);

  // Try to get cached hospitals first
  const cachedHospitals = await getCachedHospitals(60);
  let fetchedHospitals: Hospital[] = [];

  if (cachedHospitals.length > 0) {
    fetchedHospitals = cachedHospitals as unknown as Hospital[];
  } else {
    // Fetch fresh hospitals from web (OpenStreetMap)
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

  return { hospitals: sorted, userLocation, userAddress };
}

/**
 * Custom hook to fetch nearby hospitals based on user's location.
 * Uses TanStack Query for caching, deduplication, and background refetch.
 */
export const useNearbyHospitals = (): UseNearbyHospitalsReturn => {
  const { data, isLoading, error, refetch } = useQuery<HospitalQueryResult, Error>({
    queryKey: ["nearbyHospitals"],
    queryFn: fetchHospitalData,
    staleTime: 5 * 60 * 1000, // 5 minutes — don't refetch if data is fresh
    gcTime: 30 * 60 * 1000, // 30 minutes — keep in cache after unmount
    retry: 1, // Retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when user tabs back
  });

  return {
    hospitals: data?.hospitals ?? [],
    loading: isLoading,
    error: error?.message ?? null,
    userLocation: data?.userLocation ?? null,
    userAddress: data?.userAddress ?? "",
    refetch,
  };
};
