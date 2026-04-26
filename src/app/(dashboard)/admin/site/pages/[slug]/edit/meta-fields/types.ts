/**
 * Phase 3-A: every meta-fields component is on the controlled
 * `updateMeta(key, value)` API. State stays in the parent so it
 * serializes back to a single `metadata` JSON column on submit.
 */
export type MetaFieldsProps = {
  meta: Record<string, unknown>;
  updateMeta: (key: string, value: unknown) => void;
};

export type ScheduleItem = { time: string; label: string; emoji: string };
export type FacilityItem = { label: string; value: string };
export type StaffMember = { name: string; role: string; photo_url: string; profile: string };
