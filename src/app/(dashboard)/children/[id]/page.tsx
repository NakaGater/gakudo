import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { Card, CardContent, CardHeader, Badge, Button } from "@/components/ui";
import { ChildEditForm } from "./child-edit-form";
import { ChildDeleteButton } from "./child-delete-button";
import { LinkParent } from "./link-parent";

type Props = {
  params: Promise<{ id: string }>;
};

type ChildDetail = {
  id: string;
  name: string;
  grade: number;
  qr_code: string;
  qr_active: boolean;
  created_at: string;
};

type ParentInfo = {
  parent_id: string;
  profiles: { name: string; email: string } | null;
};

export default async function ChildDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getUser();
  if (user.role !== "admin" && user.role !== "teacher") redirect("/");

  const supabase = await createClient();

  const { data: child, error } = await supabase
    .from("children")
    .select("id, name, grade, qr_code, qr_active, created_at")
    .eq("id", id)
    .single<ChildDetail>();

  if (error || !child) notFound();

  const { data: parentLinks } = await supabase
    .from("child_parents")
    .select("parent_id, profiles(name, email)")
    .eq("child_id", id)
    .returns<ParentInfo[]>();

  const parents = (parentLinks ?? [])
    .filter((p): p is ParentInfo & { profiles: { name: string; email: string } } => p.profiles !== null)
    .map((p) => ({
      parent_id: p.parent_id,
      name: p.profiles.name,
      email: p.profiles.email,
    }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fg">{child.name}</h1>
        <Link href="/children">
          <Button variant="secondary" size="sm">
            一覧に戻る
          </Button>
        </Link>
      </div>

      {/* Child info */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-fg">児童情報</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-fg-muted">名前</dt>
              <dd className="font-medium text-fg">{child.name}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">学年</dt>
              <dd className="font-medium text-fg">{child.grade}年</dd>
            </div>
            <div>
              <dt className="text-fg-muted">QRコード</dt>
              <dd className="font-mono text-fg">{child.qr_code}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">ステータス</dt>
              <dd>
                <Badge variant={child.qr_active ? "success" : "danger"}>
                  {child.qr_active ? "有効" : "無効"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-fg-muted">登録日</dt>
              <dd className="text-fg">
                {new Date(child.created_at).toLocaleDateString("ja-JP")}
              </dd>
            </div>
            <div>
              <dt className="text-fg-muted">QR表示</dt>
              <dd>
                <Link
                  href={`/children/${child.id}/qr`}
                  className="text-accent hover:text-accent-hv transition-colors text-sm font-medium"
                >
                  QRコードを表示
                </Link>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-fg">編集</h2>
        </CardHeader>
        <CardContent>
          <ChildEditForm id={child.id} name={child.name} grade={child.grade} />
        </CardContent>
      </Card>

      {/* Linked parents */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold text-fg">保護者</h2>
        </CardHeader>
        <CardContent>
          <LinkParent childId={child.id} linkedParents={parents} />
        </CardContent>
      </Card>

      {/* Delete (admin only) */}
      {user.role === "admin" && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-danger">削除</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-fg-muted mb-4">
              この操作は取り消せません。関連する出欠データも削除されます。
            </p>
            <ChildDeleteButton id={child.id} name={child.name} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
