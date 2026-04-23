/** Server Action の共通レスポンス型 */
export type ActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
} | null;
