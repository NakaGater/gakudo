"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import {
  searchParents,
  linkParent,
  unlinkParent,
  type ParentSearchResult,
} from "../actions";

type LinkedParent = {
  parent_id: string;
  name: string;
  email: string;
};

type Props = {
  childId: string;
  linkedParents: LinkedParent[];
};

export function LinkParent({ childId, linkedParents }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ParentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const linkedIds = new Set(linkedParents.map((p) => p.parent_id));

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const data = await searchParents(q);
    setResults(data);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2000);
  }

  async function handleLink(parentId: string) {
    setLoading(parentId);
    const result = await linkParent(childId, parentId);
    setLoading(null);
    if (result?.success) {
      showFeedback(result.message);
      setQuery("");
      setResults([]);
      router.refresh();
    } else {
      showFeedback(result?.message ?? "エラーが発生しました");
    }
  }

  async function handleUnlink(parentId: string) {
    setLoading(parentId);
    const result = await unlinkParent(childId, parentId);
    setLoading(null);
    if (result?.success) {
      showFeedback(result.message);
      router.refresh();
    } else {
      showFeedback(result?.message ?? "エラーが発生しました");
    }
  }

  const filteredResults = results.filter((r) => !linkedIds.has(r.id));

  return (
    <div className="flex flex-col gap-4">
      {/* Currently linked parents */}
      {linkedParents.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-fg-muted mb-2">
            紐付け済みの保護者
          </h3>
          <ul className="flex flex-col gap-2">
            {linkedParents.map((p) => (
              <li
                key={p.parent_id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium text-fg">{p.name}</span>
                  <span className="text-fg-muted ml-2">{p.email}</span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  loading={loading === p.parent_id}
                  onClick={() => handleUnlink(p.parent_id)}
                >
                  解除
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Input
          label="保護者を検索"
          placeholder="名前またはメールアドレス"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searching && (
          <p className="text-xs text-fg-muted mt-1">検索中...</p>
        )}
        {filteredResults.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border border-border bg-bg-elev shadow-lg max-h-48 overflow-y-auto">
            {filteredResults.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-bg transition-colors flex items-center justify-between"
                  disabled={loading === p.id}
                  onClick={() => handleLink(p.id)}
                >
                  <div>
                    <span className="font-medium text-fg">{p.name}</span>
                    <span className="text-fg-muted ml-2">{p.email}</span>
                  </div>
                  <span className="text-xs text-accent">紐付ける</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim() &&
          !searching &&
          filteredResults.length === 0 &&
          results.length === 0 && (
            <p className="text-xs text-fg-muted mt-1">
              該当する保護者が見つかりません
            </p>
          )}
      </div>

      {/* Feedback */}
      {feedback && (
        <p className="text-sm text-success">{feedback}</p>
      )}
    </div>
  );
}
