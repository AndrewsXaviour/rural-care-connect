import { describe, it, expect, beforeEach } from "vitest";
import { getHospitalById, getHospitalName } from "@/lib/hospitalUtils";
import { mockHospitals } from "@/lib/mockData";

describe("getHospitalById", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns a hospital from mock data by ID", () => {
    const hospital = getHospitalById("h1");
    expect(hospital).toBeDefined();
    expect(hospital?.name).toBe("Srivilliputhur Government Hospital");
    expect(hospital?.latitude).toBe(9.5135);
  });

  it("returns undefined for non-existent ID", () => {
    expect(getHospitalById("nonexistent")).toBeUndefined();
  });

  it("finds hospital from cached_hospitals_map", () => {
    const fakeHospital = { id: "custom-1", name: "Custom Hospital", address: "Test", latitude: 10, longitude: 20 };
    localStorage.setItem("cached_hospitals_map", JSON.stringify({ "custom-1": fakeHospital }));

    const result = getHospitalById("custom-1");
    expect(result).toBeDefined();
    expect(result?.name).toBe("Custom Hospital");
  });

  it("finds hospital from cached_hospitals_list", () => {
    const fakeHospitals = [
      { id: "list-1", name: "List Hospital", address: "Test", latitude: 11, longitude: 21 },
    ];
    localStorage.setItem("cached_hospitals_list", JSON.stringify(fakeHospitals));

    const result = getHospitalById("list-1");
    expect(result).toBeDefined();
    expect(result?.name).toBe("List Hospital");
  });

  it("prioritizes mock data over cached data", () => {
    const fakeHospital = { id: "h1", name: "Fake Override", address: "X", latitude: 0, longitude: 0 };
    localStorage.setItem("cached_hospitals_map", JSON.stringify({ "h1": fakeHospital }));

    const result = getHospitalById("h1");
    expect(result?.name).toBe("Srivilliputhur Government Hospital"); // mock wins
  });

  it("handles invalid JSON in localStorage gracefully", () => {
    localStorage.setItem("cached_hospitals_map", "not-json{{{");
    localStorage.setItem("cached_hospitals_list", "also-not-json");

    expect(getHospitalById("h1")).toBeDefined(); // mock still works
    expect(getHospitalById("nonexistent")).toBeUndefined();
  });
});

describe("getHospitalName", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns the hospital name for a known ID", () => {
    expect(getHospitalName("h1")).toBe("Srivilliputhur Government Hospital");
  });

  it("returns 'Unknown Hospital' for non-existent ID", () => {
    expect(getHospitalName("unknown")).toBe("Unknown Hospital");
  });
});
