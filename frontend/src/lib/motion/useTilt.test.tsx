import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { MAX_TILT_DEG, tiltFor, useTilt } from "./useTilt";

describe("tiltFor", () => {
  it("is zero at the centre and capped at the edges", () => {
    expect(tiltFor(500, 400, 1000, 800)).toEqual({ tx: 0, ty: -0 });
    expect(tiltFor(1000, 0, 1000, 800)).toEqual({ tx: MAX_TILT_DEG, ty: MAX_TILT_DEG });
    expect(tiltFor(5000, 5000, 1000, 800).tx).toBe(MAX_TILT_DEG);
  });
  it("handles an empty viewport", () => {
    expect(tiltFor(10, 10, 0, 0)).toEqual({ tx: 0, ty: 0 });
  });
});

function Probe({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref, enabled);
  return <div ref={ref} data-testid="probe" />;
}

describe("useTilt", () => {
  afterEach(cleanup);

  it("does not listen when disabled (reduced motion or safe mode)", () => {
    const { getByTestId } = render(<Probe enabled={false} />);
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 900, clientY: 10, pointerType: "mouse" }));
    expect(getByTestId("probe").style.getPropertyValue("--tilt-x")).toBe("");
  });
});
