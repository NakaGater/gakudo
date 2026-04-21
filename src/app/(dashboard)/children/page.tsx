import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { Button } from "@/components/ui";

type ChildRow = {
  id: string;
  name: string;
  grade: number;
  qr_active: boolean;
  parent_count: number;
};

export default async function ChildrenPage() {
  const user = await getUser();
  if (user.role !== "admin" && user.role !== "teacher") redirect("/");

  const supabase = await createClient();

  // Fetch children with parent count via join
  const { data: children } = await supabase
    .from("children")
    .select("id, name, grade, qr_active, child_parents(parent_id)")
    .order("grade")
    .order("name")
    .returns<
      {
        id: string;
        name: string;
        grade: number;
        qr_active: boolean;
        child_parents: { parent_id: string }[];
      }[]
    >();

  const rows: ChildRow[] = (children ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    grade: c.grade,
    qr_active: c.qr_active,
    parent_count: Array.isArray(c.child_parents) ? c.child_parents.length : 0,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="main__hdr">
        <h1 className="main__title">👦 児童一覧</h1>
        <Link href="/children/new">
          <Button size="sm">新規登録</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-ink-mid">登録されている児童はいません</p>
      ) : (
        <div className="child-grid">
          {rows.map((child) => {
            const colorVariants = ["cc__av--o", "cc__av--g", "cc__av--y", "cc__av--b"] as const;
            const avColor = colorVariants[(child.grade - 1) % 4];
            return (
              <Link key={child.id} href={`/children/${child.id}`}>
                <div className="cc">
                  <div className={`cc__av ${avColor}`}>
                    {child.name.charAt(0)}
                  </div>
                  <div className="cc__info">
                    <div className="cc__name">{child.name}</div>
                    <div className="cc__meta">{child.grade}年 ・ 保護者{child.parent_count}人</div>
                    <div className="cc__tags">
                      <span className={`tag ${child.qr_active ? "tag-ok" : "tag-warn"}`}>
                        {child.qr_active ? "QR有効" : "QR無効"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
