import type { ExamClassKey } from "@/lib/exams/classes";

export type ExamSessionStatus = "draft" | "active" | "archived";

export type ExamOrderStatus =
  | "pending"
  | "contacted"
  | "confirmed"
  | "processing"
  | "delivered"
  | "cancelled";

export type ExamOrderItem = {
  class_key: ExamClassKey;
  class_label: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

export type ExamSessionPriceRow = {
  id: string;
  session_id: string;
  class_key: ExamClassKey;
  price: number;
  created_at: string;
  updated_at: string;
};

export type ExamSessionRow = {
  id: string;
  name: string;
  slug: string;
  status: ExamSessionStatus;
  created_at: string;
  updated_at: string;
};

export type ExamSessionWithPrices = ExamSessionRow & {
  prices: ExamSessionPriceRow[];
};

export type ExamOrderRow = {
  id: string;
  order_number: string;
  session_id: string;
  school_name: string;
  contact_person: string;
  phone: string;
  county: string;
  delivery_location: string;
  additional_notes: string | null;
  items: ExamOrderItem[];
  total_papers: number;
  total_amount: number;
  status: ExamOrderStatus;
  pdf_storage_path: string | null;
  created_at: string;
  updated_at: string;
};

export type ExamOrderWithSession = ExamOrderRow & {
  exam_sessions: Pick<ExamSessionRow, "id" | "name" | "slug"> | null;
};
