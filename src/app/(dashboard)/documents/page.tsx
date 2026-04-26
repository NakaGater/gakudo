import { FileText } from "lucide-react";
import Link from "next/link";
import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
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
    .order("created_at", { ascending: false })
    .returns<DocumentRow[]>();

  const documents = data ?? [];

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
    <>
      <div className="main__hdr">
        <h1 className="main__title font-story">📄 資料一覧</h1>
        {isStaff && <UploadSection />}
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-ink-mid">
          <FileText className="h-10 w-10" />
          <p>資料はまだありません</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {CATEGORY_ORDER.map((category) => {
            const catClass =
              category === "お便り"
                ? "doc-cat--letter"
                : category === "スケジュール"
                  ? "doc-cat--schedule"
                  : category === "書類"
                    ? "doc-cat--form"
                    : "";
            const docs = grouped.get(category)!;
            if (docs.length === 0) return null;
            return (
              <section key={category}>
                <div className="flex gap-1 mb-0">
                  <span className="folder-tab folder-tab--active">{category}</span>
                </div>
                <div className="folder-jacket flex flex-col gap-3">
                  <h3 className={`doc-cat ${catClass}`}>{category}</h3>
                  {docs.map((doc) => (
                    <Link key={doc.id} href={`/documents/${doc.id}`}>
                      <div className="doc-card">
                        <div className="min-w-0 flex-1">
                          <p className="doc-card__title truncate">{doc.title}</p>
                          <p className="doc-card__meta">
                            {doc.uploader?.name ?? "不明"} ・{" "}
                            {new Date(doc.created_at).toLocaleDateString("ja-JP")}
                          </p>
                        </div>
                        <span className="status-badge">{doc.category}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
