import { supabase } from "./supabase";
import { Hospital } from "./mockData";

/**
 * Cache hospitals in Supabase
 */
export const cacheHospitals = async (hospitals: Hospital[]) => {
  try {
    const timestamp = new Date().toISOString();
    const rows = hospitals.map(h => ({
      id: h.id,
      name: h.name,
      address: h.address,
      latitude: h.latitude,
      longitude: h.longitude,
      cached_at: timestamp
    }));

    const { error } = await supabase
      .from("hospitals")
      .upsert(rows);

    if (error) throw error;
    console.log(`Cached ${hospitals.length} hospitals in Supabase`);
  } catch (error) {
    console.error("Error caching hospitals in Supabase:", error);
  }
};

/**
 * Get cached hospitals from Supabase
 */
export const getCachedHospitals = async (maxAgeMinutes: number = 60): Promise<Hospital[]> => {
  try {
    const { data, error } = await supabase
      .from("hospitals")
      .select("*");

    if (error) throw error;
    if (!data) return [];

    const now = new Date();
    return data
      .filter((h: any) => {
        if (!h.cached_at) return false;
        const cachedTime = new Date(h.cached_at);
        const ageMinutes = (now.getTime() - cachedTime.getTime()) / (1000 * 60);
        return ageMinutes < maxAgeMinutes;
      })
      .map((h: any) => ({
        id: h.id,
        name: h.name,
        address: h.address,
        latitude: h.latitude,
        longitude: h.longitude
      }));
  } catch (error) {
    console.error("Error getting cached hospitals from Supabase:", error);
    return [];
  }
};

/**
 * Clear hospital cache
 */
export const clearHospitalCache = async () => {
  try {
    // Delete all rows in hospitals table
    const { error } = await supabase
      .from("hospitals")
      .delete()
      .neq("id", ""); // Supabase requires a filter for delete

    if (error) throw error;
    console.log("Cleared hospital cache in Supabase");
  } catch (error) {
    console.error("Error clearing hospital cache in Supabase:", error);
  }
};
