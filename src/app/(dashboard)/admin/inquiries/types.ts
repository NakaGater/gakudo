export type InquiryRow = {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string | null;
  preferred_date: string | null;
  message: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  replied_by: string | null;
  created_at: string | null;
};

// Phase 3-E: list view only needs the columns rendered on the index
// page; detail view still pulls every column via getInquiry.
export type InquiryListRow = Pick<
  InquiryRow,
  "id" | "type" | "name" | "message" | "status" | "created_at" | "preferred_date"
>;

export type InquiriesPage = {
  rows: InquiryListRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Phase 3-D: pagination so admin doesn't pull the entire history when
// the inquiries table grows. Lives outside actions.ts because Next.js
// "use server" files can only export async functions.
export const INQUIRIES_PAGE_SIZE = 50;
