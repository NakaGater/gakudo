import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { QRPrint } from "@/components/qr/qr-print";
import { Button } from "@/components/ui";
import { getUser } from "@/lib/auth/get-user";
import { isAdminOrTeacher } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { QRRegenerateButton } from "./qr-regenerate-button";

type Props = {
  params: Promise<{ id: string }>;
};

type ChildQR = {
  id: string;
  name: string;
  grade: number;
  qr_code: string;
  qr_active: boolean;
};

export default async function ChildQRPage({ params }: Props) {
  const { id } = await params;
  const user = await getUser();
  if (!isAdminOrTeacher(user.role)) redirect("/");

  const supabase = await createClient();
  const { data: child, error } = await supabase
    .from("children")
    .select("id, name, grade, qr_code, qr_active")
    .eq("id", id)
    .single<ChildQR>();

  if (error || !child) notFound();

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fg">QRコード</h1>
        <Link href={`/children/${id}`}>
          <Button variant="secondary" size="sm">
            戻る
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-center gap-6">
        <QRPrint value={child.qr_code} childName={child.name} grade={child.grade} />

        {user.role === "admin" && (
          <div className="mt-4 w-full border-t border-border pt-4">
            <QRRegenerateButton childId={child.id} />
          </div>
        )}
      </div>
    </div>
  );
}
