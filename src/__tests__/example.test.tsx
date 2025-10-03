/**
 * Example test to verify testing infrastructure works
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClickReelRecorder } from "../react/ClickReelRecorder";

describe("ClickReelRecorder", () => {
  it("renders placeholder component", () => {
    render(<ClickReelRecorder />);
    expect(screen.getByText(/ClickReel Recorder/i)).toBeInTheDocument();
  });

  it("shows phase 0 completion message", () => {
    render(<ClickReelRecorder />);
    expect(screen.getByText(/Phase 0 Setup Complete/i)).toBeInTheDocument();
  });
});

describe("TypeScript types", () => {
  it("can import types without errors", async () => {
    const types = await import("../types");
    expect(types).toBeDefined();
  });
});
