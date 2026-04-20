import Link from "next/link";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { Card, CardContent, Badge } from "@/components/ui";
import { UploadSection } from "./upload-section";

type DocumentRow = {
  id: string;
  title: string;
  category: string;
  file_path: string;
  created_at: string;
  uploader: { name: string };
};

const CATEGORY_ORDER = ["お便り", "スケジュール", "書類", "その他"];

export default async function DocumentsPage() {
  const user = await getUser();
  const supabase = await createClient();
  const isStaff = user.role === "teacher" || user.role === "admin";

  const { data } = await supabase
    .from("documents")
    .select(
      "id, title, category, file_path, created_at, uploader:profiles!documents_uploaded_by_fkey(name)",
    )
    .order("created_at", { ascending: false });

  const documents = (data ?? []) as unknown as DocumentRow[];

  // Group by category
  const grouped = new Map<string, DocumentRow[]>();
  for (const cat of CATEGORY_ORDER) {
    grouped.set(cat, []);
  }
  for (const doc of documents) {
    const list = grouped.get(doc.category);
    if (list) {
      list.push(doc);
    } else {
      const others = grouped.get("その他")!;
      others.push(doc);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">資料一覧</h1>
        {isStaff && <UploadSection />}
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-fg/50">
          <FileText className="h-10 w-10" />
          <p>資料はまだありません</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {CATEGORY_ORDER.map((category) => {
            const docs = grouped.get(category)!;
            if (docs.length === 0) return null;
            return (
              <section key={category}>
                <h2 className="mb-3 text-lg font-semibold text-fg">
                  {category}
                </h2>
                <div className="flex flex-col gap-3">
                  {docs.map((doc) => (
                    <Link key={doc.id} href={`/documents/${doc.id}`}>
                      <Card className="transition-colors hover:bg-bg-elev/80">
                        <CardContent className="flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-fg">
                              {doc.title}
                            </p>
                            <p className="mt-1 text-sm text-fg/60">
                              {doc.uploader?.name ?? "不明"} ・{" "}
                              {new Date(doc.created_at).toLocaleDateString(
                                "ja-JP",
                              )}
                            </p>
                          </div>
                          <Badge>{doc.category}</Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
