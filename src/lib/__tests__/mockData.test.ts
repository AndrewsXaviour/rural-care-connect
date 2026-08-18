import { describe, it, expect } from "vitest";
import {
  mockHospitals,
  mockDoctors,
  mockReports,
  DISEASE_SPECIALIZATION,
} from "@/lib/mockData";

describe("mockHospitals", () => {
  it("has at least one hospital", () => {
    expect(mockHospitals.length).toBeGreaterThan(0);
  });

  it("each hospital has required fields", () => {
    mockHospitals.forEach((h) => {
      expect(h.id).toBeTruthy();
      expect(h.name).toBeTruthy();
      expect(h.address).toBeTruthy();
      expect(typeof h.latitude).toBe("number");
      expect(typeof h.longitude).toBe("number");
    });
  });

  it("has unique IDs", () => {
    const ids = mockHospitals.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("mockDoctors", () => {
  it("has at least one doctor", () => {
    expect(mockDoctors.length).toBeGreaterThan(0);
  });

  it("each doctor has required fields", () => {
    mockDoctors.forEach((d) => {
      expect(d.id).toBeTruthy();
      expect(d.name).toBeTruthy();
      expect(d.specialization).toBeTruthy();
      expect(d.hospitalId).toBeTruthy();
      expect(Array.isArray(d.availableSlots)).toBe(true);
      expect(d.availableSlots.length).toBeGreaterThan(0);
    });
  });

  it("each doctor references a valid hospital", () => {
    const hospitalIds = mockHospitals.map((h) => h.id);
    mockDoctors.forEach((d) => {
      expect(hospitalIds).toContain(d.hospitalId);
    });
  });
});

describe("mockReports", () => {
  it("each report has required fields", () => {
    mockReports.forEach((r) => {
      expect(r.id).toBeTruthy();
      expect(r.hospitalId).toBeTruthy();
      expect(r.testName).toBeTruthy();
      expect(r.date).toBeTruthy();
      expect(r.status).toBeTruthy();
      expect(r.resultSummary).toBeTruthy();
    });
  });
});

describe("DISEASE_SPECIALIZATION", () => {
  it("maps fever to General Physician", () => {
    expect(DISEASE_SPECIALIZATION["fever"]).toBe("General Physician");
  });

  it("maps heart to Cardiologist", () => {
    expect(DISEASE_SPECIALIZATION["heart"]).toBe("Cardiologist");
  });

  it("maps bone to Orthopedic", () => {
    expect(DISEASE_SPECIALIZATION["bone"]).toBe("Orthopedic");
  });

  it("has no empty values", () => {
    Object.values(DISEASE_SPECIALIZATION).forEach((val) => {
      expect(val).toBeTruthy();
    });
  });
});
