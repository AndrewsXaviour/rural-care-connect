/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10; // Round to 1 decimal place
};

/**
 * Get user's current location using browser Geolocation API
 * Tries fast location first, then IP-based as fallback
 */
export const getUserLocation = (): Promise<GeolocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    // Try quick location first with timeout
    let timeoutReached = false;
    const timeoutId = setTimeout(() => {
      timeoutReached = true;
      // Try IP-based fallback
      getIPBasedLocation()
        .then(resolve)
        .catch(() => {
          reject(new Error("Location request timed out. Please try again."));
        });
    }, 15000); // 15 second timeout before fallback

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!timeoutReached) {
          clearTimeout(timeoutId);
          resolve(position.coords);
        }
      },
      (error) => {
        if (!timeoutReached) {
          clearTimeout(timeoutId);
          // Try IP-based fallback on error
          getIPBasedLocation()
            .then(resolve)
            .catch(() => reject(error));
        }
      },
      {
        enableHighAccuracy: false, // Faster, reasonable accuracy for hospital search
        timeout: 30000, // 30 seconds browser timeout
        maximumAge: 5 * 60 * 1000, // Use cached position up to 5 minutes old
      }
    );
  });
};

/**
 * Fallback: Get approximate location from user's IP address
 * Uses free IP geolocation service
 */
const getIPBasedLocation = async (): Promise<GeolocationCoordinates> => {
  try {
    const response = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error("IP geolocation service unavailable");
    }
    
    const data = await response.json();
    
    if (data.latitude && data.longitude) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: 5000, // Approximate accuracy (5km)
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 5000,
        }),
      };
    }
    
    throw new Error("Invalid IP geolocation response");
  } catch {
    throw new Error("Unable to determine location");
  }
};

/**
 * Get detailed address from coordinates using reverse geocoding
 * This uses OpenStreetMap Nominatim service to get precise location
 */
export const getDetailedAddress = async (
  latitude: number,
  longitude: number
): Promise<DetailedLocationInfo> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        signal: AbortSignal.timeout(5000),
      }
    );
    const data = await response.json();
    const address = data.address || {};

    // Extract precise location details
    const street = address.road || address.street || "";
    const houseNumber = address.house_number || "";
    const neighborhood = address.neighbourhood || address.suburb || address.village || "";
    const area = address.residential || address.city || address.town || "";
    const district = address.county || address.state_district || "";
    const state = address.state || "";

    // Build precise address label
    let preciseLabel = "";
    if (street && houseNumber) {
      preciseLabel = `${houseNumber} ${street}`;
    } else if (street) {
      preciseLabel = street;
    } else if (neighborhood) {
      preciseLabel = neighborhood;
    } else if (area) {
      preciseLabel = area;
    }

    if (neighborhood && neighborhood !== preciseLabel) {
      preciseLabel = `${preciseLabel}, ${neighborhood}`.trim().replace(/^,\s*/, "");
    }

    const coordinateLabel = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

    return {
      street,
      houseNumber,
      neighborhood,
      area,
      district,
      state,
      preciseLabel: preciseLabel || "Unknown Location",
      coordinates: {
        latitude,
        longitude,
        display: coordinateLabel,
      },
      fullAddress: data.address?.amenity 
        ? `${data.address.amenity}, ${preciseLabel}`
        : preciseLabel,
    };
  } catch {
    const coordinateLabel = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    return {
      street: "",
      houseNumber: "",
      neighborhood: "",
      area: "",
      district: "",
      state: "",
      preciseLabel: coordinateLabel,
      coordinates: {
        latitude,
        longitude,
        display: coordinateLabel,
      },
      fullAddress: coordinateLabel,
    };
  }
};

/**
 * Get address from coordinates using reverse geocoding
 * This uses a free reverse geocoding service
 */
export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();
    return data.address?.city || data.address?.town || data.address?.county || "Unknown Location";
  } catch {
    return "Unknown Location";
  }
};

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface DetailedLocationInfo {
  street: string;
  houseNumber: string;
  neighborhood: string;
  area: string;
  district: string;
  state: string;
  preciseLabel: string; // Primary display (street, neighborhood, or coordinates)
  coordinates: {
    latitude: number;
    longitude: number;
    display: string; // Formatted as "lat.xxxxxx, lon.xxxxxx"
  };
  fullAddress: string; // Complete address string
}
