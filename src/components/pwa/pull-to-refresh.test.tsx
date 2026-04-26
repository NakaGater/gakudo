import { render, screen, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PullToRefresh } from "./pull-to-refresh";

const mockRefresh = vi.fn();
const mockRouter = { refresh: mockRefresh };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

function setStandalone(value: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("standalone") ? value : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function setTouchCapability(hasTouch: boolean) {
  if (hasTouch) {
    Object.defineProperty(window, "ontouchstart", {
      value: null,
      configurable: true,
    });
  } else {
    delete (window as unknown as { ontouchstart?: unknown }).ontouchstart;
  }
  Object.defineProperty(navigator, "maxTouchPoints", {
    value: hasTouch ? 1 : 0,
    configurable: true,
  });
}

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", {
    value,
    configurable: true,
  });
}

type TouchType = "touchstart" | "touchmove" | "touchend" | "touchcancel";

function dispatchTouch(type: TouchType, x: number, y: number): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const touches = type === "touchend" || type === "touchcancel" ? [] : [{ clientX: x, clientY: y }];
  Object.defineProperty(event, "touches", {
    value: touches,
    configurable: true,
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

describe("PullToRefresh", () => {
  beforeEach(() => {
    mockRefresh.mockClear();
    setStandalone(true);
    setTouchCapability(true);
    setScrollY(0);
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("非PWA環境では描画せず router.refresh も呼ばれない", () => {
    setStandalone(false);
    render(<PullToRefresh />);

    dispatchTouch("touchstart", 100, 50);
    dispatchTouch("touchmove", 100, 250);
    dispatchTouch("touchend", 100, 250);

    expect(mockRefresh).not.toHaveBeenCalled();
    expect(screen.queryByRole("img", { hidden: true })).not.toBeInTheDocument();
  });

  it("タッチ非対応端末では発火しない", () => {
    setTouchCapability(false);
    render(<PullToRefresh />);

    dispatchTouch("touchstart", 100, 50);
    dispatchTouch("touchmove", 100, 250);
    dispatchTouch("touchend", 100, 250);

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("PWA + 上端で閾値超のドラッグで router.refresh() が 1 回呼ばれる", () => {
    render(<PullToRefresh />);

    dispatchTouch("touchstart", 100, 50);
    dispatchTouch("touchmove", 100, 250);
    dispatchTouch("touchend", 100, 250);

    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it("閾値未満のドラッグでは refresh しない", () => {
    render(<PullToRefresh />);

    dispatchTouch("touchstart", 100, 50);
    dispatchTouch("touchmove", 100, 80);
    dispatchTouch("touchend", 100, 80);

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("scrollY > 0 ではドラッグしても発火しない", () => {
    setScrollY(100);
    render(<PullToRefresh />);

    dispatchTouch("touchstart", 100, 50);
    dispatchTouch("touchmove", 100, 250);
    dispatchTouch("touchend", 100, 250);

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("横スワイプでは発火しない", () => {
    render(<PullToRefresh />);

    dispatchTouch("touchstart", 50, 50);
    dispatchTouch("touchmove", 250, 60);
    dispatchTouch("touchend", 250, 60);

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("上方向スワイプでは発火しない", () => {
    setScrollY(0);
    render(<PullToRefresh />);

    dispatchTouch("touchstart", 100, 250);
    dispatchTouch("touchmove", 100, 50);
    dispatchTouch("touchend", 100, 50);

    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("入力フォーカス中は発火しない", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    render(<PullToRefresh />);

    dispatchTouch("touchstart", 100, 50);
    dispatchTouch("touchmove", 100, 250);
    dispatchTouch("touchend", 100, 250);

    expect(mockRefresh).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("リフレッシュ中に再度ドラッグしても二重発火しない", () => {
    render(<PullToRefresh />);

    dispatchTouch("touchstart", 100, 50);
    dispatchTouch("touchmove", 100, 250);
    dispatchTouch("touchend", 100, 250);
    expect(mockRefresh).toHaveBeenCalledOnce();

    dispatchTouch("touchstart", 100, 50);
    dispatchTouch("touchmove", 100, 250);
    dispatchTouch("touchend", 100, 250);
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it("スナップバック完了後は再びドラッグで発火できる", async () => {
    vi.useRealTimers();
    render(<PullToRefresh />);

    dispatchTouch("touchstart", 100, 50);
    dispatchTouch("touchmove", 100, 250);
    dispatchTouch("touchend", 100, 250);
    expect(mockRefresh).toHaveBeenCalledOnce();

    // REFRESH_HOLD_MS (600) + SNAPBACK_MS (220) = 820ms; wait a margin.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 900));
    });

    dispatchTouch("touchstart", 100, 50);
    dispatchTouch("touchmove", 100, 250);
    dispatchTouch("touchend", 100, 250);

    expect(mockRefresh).toHaveBeenCalledTimes(2);
  });

  it("内側スクロール可能な祖先がまだ上にスクロール余地を持つ場合は発火しない", () => {
    const scroller = document.createElement("div");
    scroller.style.overflowY = "auto";
    Object.defineProperty(scroller, "scrollHeight", { value: 1000, configurable: true });
    Object.defineProperty(scroller, "clientHeight", { value: 400, configurable: true });
    Object.defineProperty(scroller, "scrollTop", { value: 200, configurable: true });
    const child = document.createElement("div");
    scroller.appendChild(child);
    document.body.appendChild(scroller);
    render(<PullToRefresh />);

    const start = new Event("touchstart", { bubbles: true, cancelable: true });
    Object.defineProperty(start, "touches", {
      value: [{ clientX: 100, clientY: 50 }],
      configurable: true,
    });
    Object.defineProperty(start, "target", { value: child, configurable: true });
    act(() => {
      child.dispatchEvent(start);
    });
    dispatchTouch("touchmove", 100, 250);
    dispatchTouch("touchend", 100, 250);

    expect(mockRefresh).not.toHaveBeenCalled();
    document.body.removeChild(scroller);
  });

  it("内側スクロール可能な祖先が最上部 (scrollTop=0) なら発火する", () => {
    const scroller = document.createElement("div");
    scroller.style.overflowY = "auto";
    Object.defineProperty(scroller, "scrollHeight", { value: 1000, configurable: true });
    Object.defineProperty(scroller, "clientHeight", { value: 400, configurable: true });
    Object.defineProperty(scroller, "scrollTop", { value: 0, configurable: true });
    const child = document.createElement("div");
    scroller.appendChild(child);
    document.body.appendChild(scroller);
    render(<PullToRefresh />);

    const start = new Event("touchstart", { bubbles: true, cancelable: true });
    Object.defineProperty(start, "touches", {
      value: [{ clientX: 100, clientY: 50 }],
      configurable: true,
    });
    Object.defineProperty(start, "target", { value: child, configurable: true });
    act(() => {
      child.dispatchEvent(start);
    });
    const move = new Event("touchmove", { bubbles: true, cancelable: true });
    Object.defineProperty(move, "touches", {
      value: [{ clientX: 100, clientY: 250 }],
      configurable: true,
    });
    Object.defineProperty(move, "target", { value: child, configurable: true });
    act(() => {
      child.dispatchEvent(move);
    });
    dispatchTouch("touchend", 100, 250);

    expect(mockRefresh).toHaveBeenCalledOnce();
    document.body.removeChild(scroller);
  });

  it("マルチタッチ (2 本指) では発火しない", () => {
    render(<PullToRefresh />);

    const start = new Event("touchstart", { bubbles: true, cancelable: true });
    Object.defineProperty(start, "touches", {
      value: [
        { clientX: 100, clientY: 50 },
        { clientX: 200, clientY: 50 },
      ],
      configurable: true,
    });
    act(() => {
      window.dispatchEvent(start);
    });
    dispatchTouch("touchmove", 100, 250);
    dispatchTouch("touchend", 100, 250);

    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
