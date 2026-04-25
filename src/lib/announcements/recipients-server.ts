import { createClient } from "@/lib/supabase/server";

export interface SelectableParent {
  id: string;
  name: string;
  email: string;
  /** その保護者が紐付いている児童名（UIで親を区別しやすくするため） */
  childrenLabel: string;
}

/**
 * お知らせの送信フォームで「個別選択」用に表示する保護者一覧を取得する。
 *
 * RLS 上 staff のみが child_parents を全件参照できる前提で動く。
 */
export async function loadSelectableParents(): Promise<SelectableParent[]> {
  const supabase = await createClient();

  const { data: parents, error: parentsError } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("role", "parent")
    .order("name", { ascending: true });

  if (parentsError || !parents) return [];

  const ids = parents.map((p) => p.id as string);
  if (ids.length === 0) return [];

  const { data: links } = await supabase
    .from("child_parents")
    .select("parent_id, children!inner(name, grade)")
    .in("parent_id", ids);

  type LinkRow = {
    parent_id: string;
    children: { name: string; grade: number } | { name: string; grade: number }[];
  };

  const childrenByParent = new Map<string, string[]>();
  for (const row of (links ?? []) as LinkRow[]) {
    const children = Array.isArray(row.children) ? row.children : [row.children];
    for (const c of children) {
      const list = childrenByParent.get(row.parent_id) ?? [];
      list.push(`${c.name}(${c.grade}年)`);
      childrenByParent.set(row.parent_id, list);
    }
  }

  return parents.map((p) => ({
    id: p.id as string,
    name: p.name as string,
    email: p.email as string,
    childrenLabel: (childrenByParent.get(p.id as string) ?? []).join("・"),
  }));
}
