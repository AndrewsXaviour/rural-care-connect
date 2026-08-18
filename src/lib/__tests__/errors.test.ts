import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Sentry from "@sentry/react";
import * as sonner from "sonner";
import { handleError, handleErrorSilent } from "@/lib/errors";

// Mock Sentry
vi.mock("@sentry/react", () => ({
  withScope: vi.fn((cb: (scope: { setExtra: (k: string, v: string) => void }) => void) => {
    const scope = { setExtra: vi.fn() };
    cb(scope);
  }),
  captureException: vi.fn(),
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

describe("handleError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("converts unknown error to Error instance", () => {
    const result = handleError("something broke", "Oops");
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("something broke");
  });

  it("wraps Error instances correctly", () => {
    const original = new Error("original");
    const result = handleError(original, "User message");
    expect(result).toBe(original);
    expect(result.message).toBe("original");
  });

  it("shows a toast with the user-friendly message", () => {
    handleError(new Error("internal"), "Failed to save");
    expect(sonner.toast.error).toHaveBeenCalledWith("Failed to save");
  });

  it("captures to Sentry with context", () => {
    handleError(new Error("boom"), "msg", "ProfilePage:save");
    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it("captures to Sentry without context", () => {
    handleError(new Error("boom"), "msg");
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});

describe("handleErrorSilent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures to Sentry but does NOT show a toast", () => {
    handleErrorSilent(new Error("bg failure"), "BackgroundJob");
    expect(Sentry.captureException).toHaveBeenCalled();
    expect(sonner.toast.error).not.toHaveBeenCalled();
  });

  it("returns Error instance", () => {
    const result = handleErrorSilent("weird value");
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("weird value");
  });
});
