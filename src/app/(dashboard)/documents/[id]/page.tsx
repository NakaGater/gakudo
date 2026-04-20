import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { Badge, Card, CardContent } from "@/components/ui";
import { DeleteButton } from "./delete-button";

type DocumentDetail = {
  id: string;
  title: string;
  category: string;
  file_path: string;
  uploaded_by: string;
  created_at: string;
  uploader: { name: string };
};

const IMAGE_TYPES = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

function getFileExtension(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  return dot === -1 ? "" : filePath.slice(dot).toLowerCase();
}

function isImage(filePath: string): boolean {
  return IMAGE_TYPES.includes(getFileExtension(filePath));
}

function isPdf(filePath: string): boolean {
  return getFileExtension(filePath) === ".pdf";
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(
      "id, title, category, file_path, uploaded_by, created_at, uploader:profiles!documents_uploaded_by_fkey(name)",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const doc = data as unknown as DocumentDetail;
  const canDelete = user.role === "admin" || user.id === doc.uploaded_by;

  // Generate signed URL
  const { data: signedUrlData } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_path, 3600);

  const signedUrl = signedUrlData?.signedUrl ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/documents"
        className="mb-6 inline-flex items-center gap-1 text-sm text-accent hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        資料一覧へ戻る
      </Link>

      <Card className="mt-4">
        <CardContent className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-fg">{doc.title}</h1>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-fg/60">
                <div className="flex gap-1">
                  <dt>カテゴリ:</dt>
                  <dd>
                    <Badge>{doc.category}</Badge>
                  </dd>
                </div>
                <div className="flex gap-1">
                  <dt>アップロード日:</dt>
                  <dd>
                    {new Date(doc.created_at).toLocaleDateString("ja-JP")}
                  </dd>
                </div>
                <div className="flex gap-1">
                  <dt>アップロード者:</dt>
                  <dd>{doc.uploader?.name ?? "不明"}</dd>
                </div>
              </dl>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {signedUrl && (
                <a
                  href={signedUrl}
                  download
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-hv"
                >
                  <Download className="h-4 w-4" />
                  ダウンロード
                </a>
              )}
              {canDelete && <DeleteButton documentId={doc.id} />}
            </div>
          </div>

          {/* Preview */}
          {signedUrl ? (
            <FilePreview filePath={doc.file_path} signedUrl={signedUrl} />
          ) : (
            <div className="rounded-md border border-border bg-bg p-8 text-center text-fg/50">
              ファイルが見つかりませんでした
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilePreview({
  filePath,
  signedUrl,
}: {
  filePath: string;
  signedUrl: string;
}) {
  if (isImage(filePath)) {
    return (
      <div className="flex justify-center rounded-md border border-border bg-bg p-4">
        <Image
          src={signedUrl}
          alt="プレビュー"
          width={800}
          height={600}
          className="max-w-full rounded object-contain"
          unoptimized
        />
      </div>
    );
  }

  if (isPdf(filePath)) {
    return (
      <iframe
        src={signedUrl}
        title="PDFプレビュー"
        className="w-full rounded-md border border-border"
        style={{ minHeight: "600px" }}
      />
    );
  }

  return (
    <div className="rounded-md border border-border bg-bg p-8 text-center text-fg/50">
      このファイル形式のプレビューには対応していません
    </div>
  );
}
