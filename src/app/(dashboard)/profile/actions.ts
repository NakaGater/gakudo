"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, ActionState } from "@/lib/actions/types";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionResult> {
  const user = await getUser();

  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) {
    return { success: false, message: "名前を入力してください" };
  }

  if (name.trim().length > 50) {
    return { success: false, message: "名前は50文字以内で入力してください" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ name: name.trim() }).eq("id", user.id);

  if (error) {
    return { success: false, message: `保存に失敗しました: ${error.message}` };
  }

  revalidatePath("/profile");
  return { success: true, message: "保存しました" };
}
