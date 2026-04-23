import { PageSkeleton } from "@/components/ui/page-skeleton";

export default function PublicLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageSkeleton lines={6} />
    </div>
  );
}
