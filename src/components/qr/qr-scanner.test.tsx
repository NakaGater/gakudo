import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";

const mockStart = vi.fn().mockResolvedValue(undefined);
const mockStop = vi.fn().mockResolvedValue(undefined);

vi.mock("html5-qrcode", () => {
  return {
    Html5Qrcode: class MockHtml5Qrcode {
      start = mockStart;
      stop = mockStop;
    },
  };
});

import { QRScanner } from "./qr-scanner";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("QRScanner", () => {
  const defaultProps = {
    onScan: vi.fn(),
  };

  it("renders scanner container with correct ID", () => {
    render(<QRScanner {...defaultProps} />);
    const container = document.getElementById("qr-reader");
    expect(container).toBeInTheDocument();
  });

  it("renders scanning status text", () => {
    render(<QRScanner {...defaultProps} />);
    expect(screen.getByText("QRコードをスキャン中...")).toBeInTheDocument();
  });

  it("calls onScan callback when code is decoded", async () => {
    const onScan = vi.fn();
    mockStart.mockImplementation(
      (_cameraId: unknown, _config: unknown, onSuccess: (text: string) => void) => {
        onSuccess("GK-ABC12345");
        return Promise.resolve();
      },
    );

    render(<QRScanner onScan={onScan} />);

    await waitFor(() => {
      expect(onScan).toHaveBeenCalledWith("GK-ABC12345");
    });
  });

  it("shows error message on camera denied", async () => {
    mockStart.mockRejectedValue(new Error("NotAllowedError"));

    render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("カメラへのアクセスを許可してください")).toBeInTheDocument();
    });
  });

  it("calls onError callback on camera denied", async () => {
    const onError = vi.fn();
    mockStart.mockRejectedValue(new Error("NotAllowedError"));

    render(<QRScanner onScan={vi.fn()} onError={onError} />);

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it("stops scanner on unmount", async () => {
    mockStart.mockResolvedValue(undefined);

    const { unmount } = render(<QRScanner {...defaultProps} />);

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });

    unmount();

    expect(mockStop).toHaveBeenCalled();
  });
});
