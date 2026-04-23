export type MetaFieldsProps = {
  meta: Record<string, unknown>;
  updateMeta: (key: string, value: unknown) => void;
};

export type MetaFieldsWithSetterProps = {
  meta: Record<string, unknown>;
  setMeta: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
};

export type ScheduleItem = { time: string; label: string; emoji: string };
export type FacilityItem = { label: string; value: string };
export type StaffMember = { name: string; role: string; photo_url: string; profile: string };
