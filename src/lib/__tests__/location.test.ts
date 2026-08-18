import { describe, it, expect } from "vitest";
import { calculateDistance } from "@/lib/location";

describe("calculateDistance", () => {
  it("returns 0 for identical coordinates", () => {
    expect(calculateDistance(9.5, 77.6, 9.5, 77.6)).toBe(0);
  });

  it("calculates distance between two known points (Srivilliputhur to Madurai ~55km)", () => {
    // Srivilliputhur: 9.5135, 77.6321
    // Madurai: 9.9252, 78.1198
    const dist = calculateDistance(9.5135, 77.6321, 9.9252, 78.1198);
    expect(dist).toBeGreaterThan(45);
    expect(dist).toBeLessThan(75);
  });

  it("rounds to 1 decimal place", () => {
    const dist = calculateDistance(9.5135, 77.6321, 9.5118, 77.6294);
    // Should be a small number (these points are close)
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(10);
    // Verify rounding — result should have at most 1 decimal
    const str = dist.toString();
    const decimalPart = str.split(".")[1];
    if (decimalPart) {
      expect(decimalPart.length).toBeLessThanOrEqual(1);
    }
  });

  it("returns positive distance regardless of argument order", () => {
    const d1 = calculateDistance(9.5, 77.6, 10.0, 78.0);
    const d2 = calculateDistance(10.0, 78.0, 9.5, 77.6);
    expect(d1).toBe(d2);
  });

  it("calculates distance across hemisphere (India to UK ~7000km)", () => {
    const dist = calculateDistance(28.6139, 77.209, 51.5074, -0.1278);
    expect(dist).toBeGreaterThan(6500);
    expect(dist).toBeLessThan(8000);
  });
});
