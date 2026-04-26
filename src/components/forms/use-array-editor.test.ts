import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useArrayEditor } from "./use-array-editor";

type Row = { time: string; label: string };

describe("useArrayEditor", () => {
  it("add() appends a fresh defaults entry", () => {
    const onChange = vi.fn();
    const items: Row[] = [{ time: "9:00", label: "登所" }];
    const { result } = renderHook(() =>
      useArrayEditor(items, onChange, { time: "", label: "" }),
    );

    act(() => {
      result.current.add();
    });

    expect(onChange).toHaveBeenCalledWith([
      { time: "9:00", label: "登所" },
      { time: "", label: "" },
    ]);
  });

  it("update(idx, patch) merges only the targeted row", () => {
    const onChange = vi.fn();
    const items: Row[] = [
      { time: "9:00", label: "登所" },
      { time: "12:00", label: "昼食" },
    ];
    const { result } = renderHook(() =>
      useArrayEditor(items, onChange, { time: "", label: "" }),
    );

    act(() => {
      result.current.update(1, { label: "おやつ" });
    });

    expect(onChange).toHaveBeenCalledWith([
      { time: "9:00", label: "登所" },
      { time: "12:00", label: "おやつ" },
    ]);
  });

  it("remove(idx) drops the targeted row", () => {
    const onChange = vi.fn();
    const items: Row[] = [
      { time: "9:00", label: "登所" },
      { time: "12:00", label: "昼食" },
      { time: "17:00", label: "退所" },
    ];
    const { result } = renderHook(() =>
      useArrayEditor(items, onChange, { time: "", label: "" }),
    );

    act(() => {
      result.current.remove(1);
    });

    expect(onChange).toHaveBeenCalledWith([
      { time: "9:00", label: "登所" },
      { time: "17:00", label: "退所" },
    ]);
  });

  it("add() clones defaults so callers don't share references", () => {
    const onChange = vi.fn();
    const defaults = { time: "", label: "" };
    const { result } = renderHook(() => useArrayEditor<Row>([], onChange, defaults));

    act(() => {
      result.current.add();
    });

    const next = onChange.mock.calls[0]![0] as Row[];
    expect(next[0]).not.toBe(defaults);
    expect(next[0]).toEqual(defaults);
  });

  it("set(next) replaces the whole array", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useArrayEditor<Row>([{ time: "9:00", label: "a" }], onChange, { time: "", label: "" }),
    );

    act(() => {
      result.current.set([{ time: "10:00", label: "b" }]);
    });

    expect(onChange).toHaveBeenCalledWith([{ time: "10:00", label: "b" }]);
  });
});
