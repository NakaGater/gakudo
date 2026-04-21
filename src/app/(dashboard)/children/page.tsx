import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { Button, Card, CardContent, Badge } from "@/components/ui";

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fg font-story ink-bleed">👦 児童一覧</h1>
        <Link href="/children/new">
          <Button size="sm">新規登録</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-fg-muted">登録されている児童はいません</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-sm text-fg-muted">
                  <th className="pb-3 font-medium">名前</th>
                  <th className="pb-3 font-medium">学年</th>
                  <th className="pb-3 font-medium">QRコード</th>
                  <th className="pb-3 font-medium">保護者数</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((child) => (
                  <tr key={child.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <Link
                        href={`/children/${child.id}`}
                        className="font-medium text-accent hover:text-accent-hv transition-colors"
                      >
                        {child.name}
                      </Link>
                    </td>
                    <td className="py-3">{child.grade}年</td>
                    <td className="py-3">
                      <Badge variant={child.qr_active ? "success" : "danger"}>
                        {child.qr_active ? "有効" : "無効"}
                      </Badge>
                    </td>
                    <td className="py-3">{child.parent_count}人</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 md:hidden">
            {rows.map((child) => (
              <Link key={child.id} href={`/children/${child.id}`}>
                <Card>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-fg">{child.name}</p>
                      <p className="text-sm text-fg-muted">
                        {child.grade}年 ・ 保護者{child.parent_count}人
                      </p>
                    </div>
                    <Badge variant={child.qr_active ? "success" : "danger"}>
                      {child.qr_active ? "有効" : "無効"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
