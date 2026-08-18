import { mockHospitals, Hospital } from "./mockData";

/**
 * Look up a hospital by ID.
 * Checks mock data first, then localStorage caches.
 * Used by AppointmentsPage, ReportsPage, and DoctorsPage.
 */
export const getHospitalById = (id: string): Hospital | undefined => {
  // 1. Check mock data
  const mockMatch = mockHospitals.find((h) => h.id === id);
  if (mockMatch) return mockMatch;

  // 2. Check cached hospitals map (written by DoctorsPage on booking)
  try {
    const cachedMap = JSON.parse(localStorage.getItem("cached_hospitals_map") || "{}");
    if (cachedMap[id]) return cachedMap[id] as Hospital;
  } catch {
    // Ignore parse errors
  }

  // 3. Check cached hospitals list (written by useNearbyHospitals)
  try {
    const cachedList = localStorage.getItem("cached_hospitals_list");
    if (cachedList) {
      const parsed: Hospital[] = JSON.parse(cachedList);
      const found = parsed.find((h) => h.id === id);
      if (found) return found;
    }
  } catch {
    // Ignore parse errors
  }

  return undefined;
};

/**
 * Look up a hospital name by ID.
 * Returns the name or "Unknown Hospital" as fallback.
 */
export const getHospitalName = (id: string): string => {
  return getHospitalById(id)?.name ?? "Unknown Hospital";
};
