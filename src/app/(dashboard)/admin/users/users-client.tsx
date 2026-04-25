"use client";

import { useState, useCallback, useActionState, useEffect } from "react";
import { Button } from "@/components/ui";
import { InviteForm } from "./invite-form";
import type { ActionState } from "@/lib/actions/types";
import { updateUser, deleteUser } from "./actions";
import { Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "管理者",
  teacher: "先生",
  parent: "保護者",
  entrance: "入口端末",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function EditUserRow({ user, currentUserId, onClose }: { user: Profile; currentUserId: string; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateUser, null);
  const isSelf = user.id === currentUserId;

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <tr className="border-b border-border bg-accent-light/30">
      <td colSpan={5} className="px-4 py-4">
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={user.id} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-mid">名前</label>
            <input
              name="name"
              defaultValue={user.name}
              className="rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-ink"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-mid">役割</label>
            <select
              name="role"
              defaultValue={user.role}
              disabled={isSelf}
              className="rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-ink"
            >
              <option value="parent">保護者</option>
              <option value="teacher">先生</option>
              <option value="admin">管理者</option>
            </select>
          </div>
          <Button type="submit" loading={isPending}>保存</Button>
          <button type="button" onClick={onClose} className="p-2 text-ink-mid hover:text-ink">
            <X size={16} />
          </button>
          {state?.message && (
            <span className={cn("text-sm", state.success ? "text-success" : "text-danger")}>
              {state.message}
            </span>
          )}
        </form>
      </td>
    </tr>
  );
}

function DeleteConfirm({ user, onClose }: { user: Profile; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(deleteUser, null);

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm mx-4 rounded-lg bg-bg-elev p-6 shadow-lg">
        <h3 className="text-lg font-bold text-ink mb-2">ユーザー削除</h3>
        <p className="text-sm text-ink-mid mb-4">
          <span className="font-medium text-ink">{user.name}</span>（{user.email}）を削除しますか？
          <br />この操作は取り消せません。
        </p>
        {state?.message && (
          <p className={cn("text-sm mb-3", state.success ? "text-success" : "text-danger")}>
            {state.message}
          </p>
        )}
        <form action={formAction} className="flex justify-end gap-2">
          <input type="hidden" name="id" value={user.id} />
          <Button type="button" variant="ghost" onClick={onClose}>キャンセル</Button>
          <Button type="submit" variant="destructive" loading={isPending}>削除する</Button>
        </form>
      </div>
    </div>
  );
}

export function UsersClient({ users, currentUserId }: { users: Profile[]; currentUserId: string }) {
  const [showInvite, setShowInvite] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const handleCloseInvite = useCallback(() => setShowInvite(false), []);

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        {!showInvite && (
          <Button onClick={() => setShowInvite(true)}>ユーザー招待</Button>
        )}
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md mx-4">
            <InviteForm onClose={handleCloseInvite} />
          </div>
        </div>
      )}

      {deletingUser && (
        <DeleteConfirm user={deletingUser} onClose={() => setDeletingUser(null)} />
      )}

      <div className="rounded-md overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 font-medium text-ink-mid">名前</th>
              <th className="px-4 py-3 font-medium text-ink-mid">メールアドレス</th>
              <th className="px-4 py-3 font-medium text-ink-mid">役割</th>
              <th className="px-4 py-3 font-medium text-ink-mid">登録日</th>
              <th className="px-4 py-3 font-medium text-ink-mid w-24">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) =>
              editingId === u.id ? (
                <EditUserRow
                  key={u.id}
                  user={u}
                  currentUserId={currentUserId}
                  onClose={() => setEditingId(null)}
                />
              ) : (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3 text-ink-mid">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`role-badge role-badge--${u.role}`}>
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-mid">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingId(u.id)}
                        className="p-1.5 rounded text-ink-mid hover:text-accent hover:bg-accent-light transition-colors"
                        aria-label={`${u.name}を編集`}
                      >
                        <Pencil size={15} />
                      </button>
                      {u.id !== currentUserId && (
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-1.5 rounded text-ink-mid hover:text-danger hover:bg-danger/10 transition-colors"
                          aria-label={`${u.name}を削除`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ),
            )}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-mid">
                  ユーザーがいません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
