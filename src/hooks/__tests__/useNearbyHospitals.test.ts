import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useNearbyHospitals } from "@/hooks/useNearbyHospitals";

// Mock the fetchHospitalData dependencies
vi.mock("@/lib/location", () => ({
  calculateDistance: vi.fn(() => 5.0),
  getUserLocation: vi.fn(() =>
    Promise.resolve({ latitude: 9.5135, longitude: 77.6321 })
  ),
  getAddressFromCoordinates: vi.fn(() => Promise.resolve("Srivilliputhur")),
}));

vi.mock("@/lib/hospitalScraper", () => ({
  fetchHospitalsFromWeb: vi.fn(() =>
    Promise.resolve([
      {
        id: "h1",
        name: "Test Hospital",
        address: "Test Address",
        latitude: 9.51,
        longitude: 77.63,
      },
    ])
  ),
}));

vi.mock("@/lib/supabaseDb", () => ({
  cacheHospitals: vi.fn(() => Promise.resolve()),
  getCachedHospitals: vi.fn(() => Promise.resolve([])),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
}

describe("useNearbyHospitals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts in loading state", () => {
    const { result } = renderHook(() => useNearbyHospitals(), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.hospitals).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("returns hospitals after loading", async () => {
    const { result } = renderHook(() => useNearbyHospitals(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hospitals.length).toBeGreaterThan(0);
    expect(result.current.hospitals[0].name).toBe("Test Hospital");
    expect(result.current.userAddress).toBe("Srivilliputhur");
  });

  it("returns userLocation after loading", async () => {
    const { result } = renderHook(() => useNearbyHospitals(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.userLocation).toEqual({
      latitude: 9.5135,
      longitude: 77.6321,
    });
  });
});
