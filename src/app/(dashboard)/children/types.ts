import type { ActionState as BaseActionState } from "@/lib/actions/types";

export type ActionState = NonNullable<BaseActionState> & { childId?: string } | null;
