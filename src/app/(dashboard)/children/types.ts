import type { ActionResult as BaseActionResult } from "@/lib/actions/types";

export type ActionResult = BaseActionResult & { childId?: string };
export type ActionState = ActionResult | null;
