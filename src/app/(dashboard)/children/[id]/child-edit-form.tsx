"use client";

import { useActionState } from "react";
import { Button, Input } from "@/components/ui";
import { updateChild } from "../actions";
import type { ActionState } from "../types";

const grades = [1, 2, 3, 4, 5, 6] as const;

type Props = {
  id: string;
  name: string;
  grade: number;
};

export function ChildEditForm({ id, name, grade }: Props) {
  const updateWithId = updateChild.bind(null, id);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateWithId, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input name="name" label="名前" required defaultValue={name} />

      <div className="flex flex-col gap-1">
        <label htmlFor="edit-grade" className="text-sm font-medium text-fg">
          学年
        </label>
        <select
          id="edit-grade"
          name="grade"
          required
          defaultValue={grade}
          className="h-10 w-full rounded-sm border border-border bg-bg-elev px-3 text-fg focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none"
        >
          {grades.map((g) => (
            <option key={g} value={g}>
              {g}年
            </option>
          ))}
        </select>
      </div>

      {state && !state.success && <p className="text-sm text-danger">{state.message}</p>}
      {state?.success && <p className="text-sm text-success">{state.message}</p>}

      <Button type="submit" loading={isPending}>
        更新する
      </Button>
    </form>
  );
}
