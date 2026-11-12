import { describe, expect, it } from "vitest";
import { dayKey, fmtShort } from "./time";

describe("wall-clock times", () => {
  it("formats without shifting the day or hour", () => {
    expect(fmtShort("2026-11-20T23:30")).toBe("Fri 20 Nov · 23:30");
    expect(dayKey("2026-11-20T00:15")).toBe("2026-11-20");
  });
});
