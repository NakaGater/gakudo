import { getNumber, getString } from "@/lib/validation/form";
import type { ActionState } from "./types";

type ValidationOk = { ok: true; name: string; grade: number };
type ValidationErr = { ok: false; error: NonNullable<ActionState> };
export type ChildFormValidationResult = ValidationOk | ValidationErr;

/** 児童フォームの入力バリデーション (純粋関数) */
export function validateChildForm(formData: FormData): ChildFormValidationResult {
  // Phase 2-D: getString / getNumber centralize the typeof + range
  // checks; messages preserved verbatim for the existing tests.
  const nameR = getString(formData, "name", { message: "名前を入力してください" });
  if (!nameR.ok) {
    return { ok: false, error: { success: false, message: nameR.error } };
  }

  const gradeR = getNumber(formData, "grade", {
    integer: true,
    min: 1,
    max: 6,
    message: "学年は1〜6を選択してください",
  });
  if (!gradeR.ok) {
    return { ok: false, error: { success: false, message: gradeR.error } };
  }

  return { ok: true, name: nameR.value, grade: gradeR.value };
}
