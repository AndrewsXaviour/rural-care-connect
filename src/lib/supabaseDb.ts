import { supabase } from "./supabase";
import { Hospital } from "./mockData";

// Supabase row type matching the hospitals table schema
interface SupabaseHospitalRow {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  cached_at: string;
}

interface DbResult<T> {
  data: T | null;
  error: { message: string } | null;
}

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
  } catch {
    // Silently handle cache errors
  }
};

/**
 * Get cached hospitals from Supabase
 */
export const getCachedHospitals = async (maxAgeMinutes: number = 60): Promise<Hospital[]> => {
  try {
    const { data, error } = await supabase
      .from("hospitals")
      .select("*") as unknown as DbResult<SupabaseHospitalRow[]>;

    if (error) throw error;
    if (!data) return [];

    const now = new Date();
    return data
      .filter((h) => {
        if (!h.cached_at) return false;
        const cachedTime = new Date(h.cached_at);
        const ageMinutes = (now.getTime() - cachedTime.getTime()) / (1000 * 60);
        return ageMinutes < maxAgeMinutes;
      })
      .map((h) => ({
        id: h.id,
        name: h.name,
        address: h.address,
        latitude: h.latitude,
        longitude: h.longitude
      }));
  } catch {
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
  } catch {
    // Silently handle cache clear errors
  }
};
