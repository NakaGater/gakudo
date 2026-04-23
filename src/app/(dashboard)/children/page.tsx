import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { isAdminOrTeacher } from "@/lib/auth/roles";
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
  if (!isAdminOrTeacher(user.role)) redirect("/");

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

  const gradeEmoji: Record<number, string> = { 1: "🌸", 2: "🌿", 3: "🍂", 4: "⭐", 5: "🌊", 6: "🎓" };
  const colorVariants = ["cc__av--o", "cc__av--g", "cc__av--y", "cc__av--b"] as const;

  // Group children by grade
  const grouped = rows.reduce<Record<number, ChildRow[]>>((acc, row) => {
    (acc[row.grade] ??= []).push(row);
    return acc;
  }, {});
  const grades = Object.keys(grouped).map(Number).sort();

  return (
    <div>
      <div className="main__hdr">
        <h1 className="main__title">📖 児童一覧</h1>
        <Link href="/children/new">
          <Button size="sm">＋ 新規登録</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__hoshi">
            <svg width="64" height="72" viewBox="0 0 32 38" aria-hidden>
              <path d="M16 2l3.5 10.5H30l-8.5 6.5 3.2 10L16 22.5 7.3 29l3.2-10L2 12.5h10.5z" fill="#FFD93D" stroke="#E8B830" strokeWidth="1.5"/>
              <circle cx="11" cy="13" r="1.5" fill="#3B2F20"/><circle cx="21" cy="13" r="1.5" fill="#3B2F20"/>
              <circle cx="8" cy="16" r="2" fill="#FFB5C5" opacity=".55"/><circle cx="24" cy="16" r="2" fill="#FFB5C5" opacity=".55"/>
              <path d="M13 19 Q16 17 19 19" fill="none" stroke="#3B2F20" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="empty-state__text">まだ だれも いないよ…</div>
          <div className="empty-state__sub">「新規登録」から児童を追加してね</div>
        </div>
      ) : (
        <div>
          {grades.map((grade) => {
            const kids = grouped[grade];
            const emoji = gradeEmoji[grade] ?? "📚";
            return (
              <div key={grade}>
                <div className="grade-div">
                  <div className="grade-div__label">{emoji} {grade}年生 <span className="grade-div__count">（{kids.length}名）</span></div>
                  <div className="grade-div__line" />
                </div>
                <div className="child-grid">
                  {kids.map((child) => {
                    const avColor = colorVariants[(child.grade - 1) % 4];
                    return (
                      <Link key={child.id} href={`/children/${child.id}`}>
                        <div className="cc">
                          <div className={`cc__av ${avColor}`}>{child.name.charAt(0)}</div>
                          <div className="cc__info">
                            <div className="cc__name">{child.name}</div>
                            <div className="cc__meta">{child.grade}年 ・ 保護者{child.parent_count}人</div>
                            <div className="cc__tags">
                              <span className={`tag ${child.qr_active ? "tag-ok" : "tag-warn"}`}>
                                {child.qr_active ? "✓ QR有効" : "✕ QR無効"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
