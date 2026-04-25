import type { ActionState } from "./types";

type ValidationOk = { ok: true; name: string; grade: number };
type ValidationErr = { ok: false; error: NonNullable<ActionState> };
export type ChildFormValidationResult = ValidationOk | ValidationErr;

/** 児童フォームの入力バリデーション (純粋関数) */
export function validateChildForm(formData: FormData): ChildFormValidationResult {
  const name = formData.get("name");
  const gradeStr = formData.get("grade");

  if (typeof name !== "string" || !name.trim()) {
    return { ok: false, error: { success: false, message: "名前を入力してください" } };
  }

  const grade = Number(gradeStr);
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) {
    return { ok: false, error: { success: false, message: "学年は1〜6を選択してください" } };
  }

  return { ok: true, name: name.trim(), grade };
}
