import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { QRDisplay } from "./qr-display";

afterEach(cleanup);

describe("QRDisplay", () => {
  const defaultProps = {
    value: "GK-ABC12345",
    childName: "テスト太郎",
    grade: 3,
  };

  it("renders QR code SVG with correct value", () => {
    render(<QRDisplay {...defaultProps} />);
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("displays child name", () => {
    render(<QRDisplay {...defaultProps} />);
    expect(screen.getByText("テスト太郎")).toBeInTheDocument();
  });

  it("shows grade info", () => {
    render(<QRDisplay {...defaultProps} />);
    expect(screen.getByText("3年")).toBeInTheDocument();
  });

  it("displays QR code value", () => {
    render(<QRDisplay {...defaultProps} />);
    expect(screen.getByText("GK-ABC12345")).toBeInTheDocument();
  });

  it("uses default size of 200", () => {
    render(<QRDisplay {...defaultProps} />);
    const svg = document.querySelector("svg");
    expect(svg?.getAttribute("height")).toBe("200");
    expect(svg?.getAttribute("width")).toBe("200");
  });

  it("accepts custom size", () => {
    render(<QRDisplay {...defaultProps} size={150} />);
    const svg = document.querySelector("svg");
    expect(svg?.getAttribute("height")).toBe("150");
    expect(svg?.getAttribute("width")).toBe("150");
  });
});
