import { render, screen, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { HeroSlideshow } from "./hero-slideshow";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const ILLUSTRATION = <div data-testid="illustration">星ちゃんイラスト</div>;

describe("HeroSlideshow", () => {
  describe("写真がない場合", () => {
    it("イラストのみ表示される", () => {
      render(<HeroSlideshow photoUrls={[]}>{ILLUSTRATION}</HeroSlideshow>);
      expect(screen.getByTestId("illustration")).toBeInTheDocument();
    });

    it("写真のimg要素は存在しない", () => {
      render(<HeroSlideshow photoUrls={[]}>{ILLUSTRATION}</HeroSlideshow>);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("5秒経過してもイラストが表示されたまま", () => {
      render(<HeroSlideshow photoUrls={[]}>{ILLUSTRATION}</HeroSlideshow>);
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByTestId("illustration")).toBeInTheDocument();
    });
  });

  describe("写真がある場合", () => {
    const photoUrls = ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"];

    it("初期表示はイラスト", () => {
      render(<HeroSlideshow photoUrls={photoUrls}>{ILLUSTRATION}</HeroSlideshow>);
      const illustrationSlide = screen.getByTestId("slide-0");
      expect(illustrationSlide).toHaveAttribute("data-active", "true");
    });

    it("5秒後に写真1に切り替わる", () => {
      render(<HeroSlideshow photoUrls={photoUrls}>{ILLUSTRATION}</HeroSlideshow>);
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      const slide1 = screen.getByTestId("slide-1");
      expect(slide1).toHaveAttribute("data-active", "true");
    });

    it("10秒後に写真2に切り替わる", () => {
      render(<HeroSlideshow photoUrls={photoUrls}>{ILLUSTRATION}</HeroSlideshow>);
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      const slide2 = screen.getByTestId("slide-2");
      expect(slide2).toHaveAttribute("data-active", "true");
    });

    it("全スライド表示後、イラストに戻る（ループ）", () => {
      render(<HeroSlideshow photoUrls={photoUrls}>{ILLUSTRATION}</HeroSlideshow>);
      // イラスト(0) → 写真1(5s) → 写真2(10s) → イラスト(15s)
      act(() => {
        vi.advanceTimersByTime(15000);
      });
      const slide0 = screen.getByTestId("slide-0");
      expect(slide0).toHaveAttribute("data-active", "true");
    });

    it("写真にalt属性が設定される", () => {
      render(<HeroSlideshow photoUrls={photoUrls}>{ILLUSTRATION}</HeroSlideshow>);
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(2);
      images.forEach((img, i) => {
        expect(img).toHaveAttribute("alt", `写真 ${i + 1}`);
      });
    });

    it("写真のsrc属性が正しい", () => {
      render(<HeroSlideshow photoUrls={photoUrls}>{ILLUSTRATION}</HeroSlideshow>);
      const images = screen.getAllByRole("img");
      // next/image may encode the src, so check it contains the original URL
      expect(images[0]!.getAttribute("src")).toContain("photo1.jpg");
      expect(images[1]!.getAttribute("src")).toContain("photo2.jpg");
    });
  });

  describe("写真が1枚の場合", () => {
    const photoUrls = ["https://example.com/single.jpg"];

    it("イラスト→写真→イラストとループする", () => {
      render(<HeroSlideshow photoUrls={photoUrls}>{ILLUSTRATION}</HeroSlideshow>);

      // 初期: イラスト
      expect(screen.getByTestId("slide-0")).toHaveAttribute("data-active", "true");

      // 5秒: 写真
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByTestId("slide-1")).toHaveAttribute("data-active", "true");

      // 10秒: イラストに戻る
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByTestId("slide-0")).toHaveAttribute("data-active", "true");
    });
  });

  describe("アンマウント時", () => {
    it("タイマーがクリアされる", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");
      const { unmount } = render(
        <HeroSlideshow photoUrls={["https://example.com/photo.jpg"]}>{ILLUSTRATION}</HeroSlideshow>,
      );
      unmount();
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });
});
