/** Server Action が返す結果オブジェクト (常に非null) */
export type ActionResult = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

/** useActionState の state 型 (初期値は null) */
export type ActionState = ActionResult | null;
