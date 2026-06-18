import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNearbyHospitals } from "@/hooks/useNearbyHospitals";
import { toast } from "sonner";
import { Hospital } from "@/lib/mockData";
import { calculateDistance } from "@/lib/location";
import { fetchHospitalsFromWeb } from "@/lib/hospitalScraper";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Building2, ArrowRight, ChevronLeft, RefreshCw, Loader2, Crosshair, Compass } from "lucide-react";

const HospitalsPage = () => {
  const navigate = useNavigate();
  const { hospitals, loading, error, userLocation, userAddress, refetch } = useNearbyHospitals();
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [radiusFilter, setRadiusFilter] = useState(50);
  const [manualHospitals, setManualHospitals] = useState<Hospital[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualAddress, setManualAddress] = useState("");

  const activeHospitals = manualHospitals.length > 0 ? manualHospitals : hospitals;
  const activeAddress = manualAddress || userAddress;

  const filteredHospitals = activeHospitals.filter(
    (hospital) => (hospital.distance || 0) <= radiusFilter
  );

  useEffect(() => {
    if (activeHospitals.length > 0) {
      try {
        localStorage.setItem("cached_hospitals_list", JSON.stringify(activeHospitals));
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [activeHospitals]);

  const handleManualLocation = async () => {
    let query = locationInput.trim();
    if (!query) return;

    const lowerQuery = query.toLowerCase();
    if (lowerQuery === "srivilliputur" || lowerQuery === "srivilliputtur") {
      query = "Srivilliputhur";
    }

    try {
      setManualLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { signal: AbortSignal.timeout(10000) }
      );
      const results = await response.json();

      if (!results || results.length === 0) {
        toast.error(`Could not find location "${query}". Try a different name.`);
        return;
      }

      const { lat, lon, display_name } = results[0];
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);

      toast.info(`Searching hospitals near ${display_name.split(",")[0]}...`);

      const fetchedHospitals = await fetchHospitalsFromWeb(latitude, longitude, 50);

      if (fetchedHospitals.length === 0) {
        toast.warning("No hospitals found near this location. Try a different area.");
        return;
      }

      const withDistances = fetchedHospitals.map((h) => ({
        ...h,
        distance: calculateDistance(latitude, longitude, h.latitude, h.longitude),
      }));

      const sorted = withDistances.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setManualHospitals(sorted);
      setManualAddress(display_name.split(",").slice(0, 2).join(","));
      setShowLocationInput(false);
      setLocationInput("");
      toast.success(`Found ${sorted.length} hospitals near "${query}"`);
    } catch (err) {
      console.error("Manual location search error:", err);
      toast.error("Failed to search this location. Please try again.");
    } finally {
      setManualLoading(false);
    }
  };

  const clearManualSearch = () => {
    setManualHospitals([]);
    setManualAddress("");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 relative"
    >
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Healthcare Facilities</h1>
            <p className="text-gray-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {activeAddress
                ? `Near ${activeAddress} • ${filteredHospitals.length} Found`
                : "Based on your current location"}
            </p>
          </div>
          {manualHospitals.length > 0 && (
            <button
              onClick={clearManualSearch}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              My Location
            </button>
          )}
        </div>
      </motion.div>

      {/* Prominent Search Bar */}
      <motion.div variants={itemVariants} className="glass-card p-2 pl-4 flex items-center gap-3 relative z-20 focus-within:ring-1 focus-within:ring-primary/50 transition-shadow">
        <Search className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by city or area (e.g. Srivilliputhur)..."
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleManualLocation()}
          disabled={manualLoading}
          className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 focus:outline-none focus:ring-0 h-10"
        />
        <button
          onClick={handleManualLocation}
          disabled={manualLoading || !locationInput.trim()}
          className="px-6 py-2.5 bg-primary/20 hover:bg-primary text-primary hover:text-background font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          {manualLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching
            </span>
          ) : "Search"}
        </button>
      </motion.div>

      {/* Filter Controls */}
      <AnimatePresence>
        {!loading && !manualLoading && activeHospitals.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col sm:flex-row sm:items-center gap-4 bg-secondary/30 rounded-xl p-4 border border-white/5"
          >
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <Crosshair className="w-4 h-4" />
                  Search Radius
                </label>
                <span className="text-sm font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">{radiusFilter} km</span>
              </div>
              <input
                type="range"
                min="2"
                max="50"
                value={radiusFilter}
                onChange={(e) => setRadiusFilter(Number(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs font-medium text-gray-500">
                <span>2 km</span>
                <span>50 km</span>
              </div>
            </div>
            {filteredHospitals.length === 0 && (
              <div className="sm:w-1/3 bg-primary/10 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-primary leading-relaxed">
                  No hospitals found within {radiusFilter} km. Try expanding the search radius.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {error && (
        <motion.div variants={itemVariants} className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 space-y-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-400">Connection Error</p>
              <p className="text-xs text-red-400/80 mt-1 leading-relaxed">
                {error === "Location request timed out. Please try again."
                  ? "Location request timed out. Please check your GPS signal."
                  : error.includes("location")
                    ? error
                    : "Unable to sync with healthcare databases. Please try again."}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch().catch(() => toast.error("Failed to refresh"))}
            className="text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Connection
          </button>
        </motion.div>
      )}

      {/* Content Area */}
      <div className="relative min-h-[400px]">
        {(manualLoading || (loading && manualHospitals.length === 0 && hospitals.length === 0)) ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-gray-400 py-4">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-sm font-medium">{manualLoading ? "Scanning area..." : "Establishing secure connection & locating facilities..."}</span>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse border-white/5">
                <div className="flex sm:items-center flex-col sm:flex-row gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/5"></div>
                  <div className="flex-1 space-y-3 w-full">
                    <div className="h-5 bg-white/5 rounded-md w-1/3"></div>
                    <div className="h-4 bg-white/5 rounded-md w-2/3"></div>
                  </div>
                  <div className="h-10 bg-white/5 rounded-lg w-24 sm:w-32 mt-4 sm:mt-0"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activeHospitals.length === 0 ? (
          <motion.div variants={itemVariants} className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 glass-card border-dashed">
            <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
              <Compass className="w-8 h-8 text-gray-500 opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No facilities located</h3>
            <p className="text-gray-400 max-w-sm mb-6">We couldn't find any registered healthcare providers in the current area parameters.</p>
            <button
              onClick={() => refetch().catch(() => toast.error("Failed to retry"))}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Reset to device location
            </button>
          </motion.div>
        ) : filteredHospitals.length === 0 ? (
          <motion.div variants={itemVariants} className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 glass-card border-dashed border-primary/20">
            <Crosshair className="w-12 h-12 text-gray-500 opacity-50 mb-4" />
            <p className="text-lg font-semibold text-white mb-2">Outside Radius</p>
            <p className="text-sm text-gray-400 mb-6">There are hospitals available, but they are outside your {radiusFilter}km limit.</p>
            <button
              onClick={() => setRadiusFilter(50)}
              className="px-6 py-2 bg-primary/20 hover:bg-primary text-primary hover:text-background rounded-full transition-colors text-sm font-medium"
            >
              Expand to 50km
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredHospitals.map((hospital, index) => (
                <motion.div
                  key={hospital.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card-hover p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 group cursor-pointer relative overflow-hidden"
                  onClick={() => navigate(`/hospitals/${hospital.id}/doctors`)}
                >
                  {/* Subtle Hover Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out z-0"></div>
                  
                  <div className="flex gap-5 relative z-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-primary/70" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{hospital.name}</h3>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2 leading-relaxed max-w-xl">{hospital.address}</p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
                          General
                        </span>
                        {hospital.distance && hospital.distance < 10 && (
                          <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-semibold uppercase tracking-wider">
                            Very Close
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 sm:gap-4 relative z-10 border-t border-white/5 sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-xl font-black text-white tracking-tight flex items-baseline gap-1">
                        {hospital.distance} <span className="text-xs font-semibold text-primary uppercase">km</span>
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mt-0.5">Distance</span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/hospitals/${hospital.id}/doctors`);
                      }}
                      className="px-6 py-2.5 bg-white text-black hover:bg-primary hover:text-white font-bold rounded-xl transition-all duration-300 shadow-md group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center gap-2"
                    >
                      Book
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HospitalsPage;
