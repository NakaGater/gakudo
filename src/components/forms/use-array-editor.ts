import { useCallback, useMemo } from "react";

/**
 * Controlled array-of-objects editor for parent-owned state.
 *
 * Plenty of CMS forms have repeating sections (schedule rows, FAQ
 * entries, staff members) where each render does:
 *
 *   const updated = [...items];
 *   updated[idx] = { ...updated[idx], field: value };
 *   onChange("key", updated);
 *
 * This hook collapses that into `editor.update(idx, { field: value })`.
 *
 * It is **controlled** on purpose: state lives in the parent (so it can
 * be serialized back into a single `metadata` object on submit). The
 * hook is a pure adapter — no internal state — which means it composes
 * trivially with `updateMeta(key, value)`-style APIs:
 *
 *   const schedule = (meta.schedule as ScheduleItem[]) ?? [];
 *   const editor = useArrayEditor(
 *     schedule,
 *     (next) => updateMeta("schedule", next),
 *     { time: "", label: "", emoji: "" },
 *   );
 *   editor.add();             // appends a fresh defaults entry
 *   editor.update(0, { time: "9:00" });
 *   editor.remove(0);
 */
export type ArrayEditor<T> = {
  items: T[];
  add: () => void;
  update: (index: number, patch: Partial<T>) => void;
  remove: (index: number) => void;
  set: (next: T[]) => void;
};

export function useArrayEditor<T>(
  items: T[],
  onChange: (next: T[]) => void,
  defaults: T,
): ArrayEditor<T> {
  const add = useCallback(() => {
    onChange([...items, { ...defaults }]);
  }, [items, onChange, defaults]);

  const update = useCallback(
    (index: number, patch: Partial<T>) => {
      onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
    },
    [items, onChange],
  );

  const remove = useCallback(
    (index: number) => {
      onChange(items.filter((_, i) => i !== index));
    },
    [items, onChange],
  );

  const set = useCallback(
    (next: T[]) => {
      onChange(next);
    },
    [onChange],
  );

  return useMemo(
    () => ({ items, add, update, remove, set }),
    [items, add, update, remove, set],
  );
}
