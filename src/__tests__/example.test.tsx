/**
 * Example test to verify testing infrastructure works
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClickReelRecorder } from "../react/ClickReelRecorder";
import { ClickReelProvider } from "../react/ClickReelProvider";

describe("ClickReelRecorder", () => {
  it("renders recorder UI", () => {
    render(
      <ClickReelProvider>
        <ClickReelRecorder />
      </ClickReelProvider>
    );
    expect(screen.getByTestId('click-reel-recorder')).toBeInTheDocument();
    expect(screen.getByText(/Click Reel/i)).toBeInTheDocument();
  });

  it("shows initial status", () => {
    render(
      <ClickReelProvider>
        <ClickReelRecorder />
      </ClickReelProvider>
    );
    expect(screen.getByText(/Idle/i)).toBeInTheDocument();
  });
});

describe("TypeScript types", () => {
  it("can import types without errors", async () => {
    const types = await import("../types");
    expect(types).toBeDefined();
  });
});
