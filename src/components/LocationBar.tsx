import { useState, useEffect } from "react";
import { getDetailedAddress, getUserLocation, DetailedLocationInfo } from "@/lib/location";
import { MapPin, RefreshCw } from "lucide-react";

/**
 * Component to display user's precise current location in the header
 * Fetches coordinates for hospital scraping but displays only address
 */
export const LocationBar = () => {
  const [locationInfo, setLocationInfo] = useState<DetailedLocationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRefresh, setShowRefresh] = useState(false);

  const fetchLocation = async () => {
    try {
      setLoading(true);
      const coords = await getUserLocation();
      const detailedAddr = await getDetailedAddress(coords.latitude, coords.longitude);
      setLocationInfo(detailedAddr);
      localStorage.setItem(
        "userLocation",
        JSON.stringify({
          ...detailedAddr,
          timestamp: new Date().toISOString(),
        })
      );
      setShowRefresh(true);
      setTimeout(() => setShowRefresh(false), 3000);
    } catch (error) {
      console.error("Error fetching location:", error);
      setShowRefresh(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        setLocationInfo(parsed);
      } catch {
        fetchLocation();
      }
    } else {
      fetchLocation();
    }
  }, []);

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 glass-card rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
        <MapPin className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Your Location</p>
        {loading ? (
          <p className="text-xs text-gray-400 truncate">Detecting location...</p>
        ) : locationInfo ? (
          <>
            <p className="text-xs text-white font-medium truncate">
              {locationInfo.preciseLabel}
            </p>
            <p className="text-[11px] text-gray-500 truncate">
              {locationInfo.area && locationInfo.district
                ? `${locationInfo.area}, ${locationInfo.district}`
                : locationInfo.area || locationInfo.district || ""}
            </p>
            {showRefresh && (
              <p className="text-[10px] text-primary font-medium animate-pulse">Location updated</p>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-500 truncate">Enable location access</p>
        )}
      </div>
      <button
        onClick={fetchLocation}
        disabled={loading}
        className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-gray-400 hover:text-white disabled:opacity-50 transition-all flex-shrink-0"
        title="Refresh location"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
};
