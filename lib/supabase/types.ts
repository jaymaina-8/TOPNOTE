/**
 * Database types for Supabase. Replace or extend by running:
 * `npx supabase gen types typescript --project-id <id> > lib/supabase/types.generated.ts`
 * and merging into `Database` when you adopt generated output.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Allowed values for `categories.type` (CHECK constraint in schema). */
export type CategoryType = "books" | "exams" | "stationery" | "lab";

/** Allowed values for `book_subcategories.slug`. Intentionally open-ended for future book types. */
export type BookSubcategorySlug = string;

/** Public book filter values. `all` means no book subcategory filter. */
export type BookTypeFilter = string;

/** Inquiry workflow status (`inquiries.status`). */
export type InquiryStatus = "new" | "contacted" | "closed";

/** Inquiry attribution (`inquiries.source_type`). */
export type SourceType = "product" | "contact" | "general";

/** Conversion tracking event types we record in `conversion_events`. */
export type ConversionEventType = "whatsapp_click" | "phone_click" | "inquiry_submit";

/** Exam session workflow status (`exam_sessions.status`). */
export type ExamSessionStatus = "draft" | "active" | "archived";

/** Exam order workflow status (`exam_orders.status`). */
export type ExamOrderStatus =
  | "pending"
  | "contacted"
  | "confirmed"
  | "processing"
  | "delivered"
  | "cancelled";

/** Allowed values for `exam_session_prices.class_key`. */
export type ExamClassKey =
  | "playgroup"
  | "pp1"
  | "pp2"
  | "grade_1"
  | "grade_2"
  | "grade_3"
  | "grade_4"
  | "grade_5"
  | "grade_6"
  | "grade_7"
  | "grade_8"
  | "grade_9";

export type Database = {
  public: {
    Tables: {
      book_subcategories: {
        Row: {
          id: string;
          name: string;
          slug: BookSubcategorySlug;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: BookSubcategorySlug;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: BookSubcategorySlug;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: CategoryType;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          type: CategoryType;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          type?: CategoryType;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category_id: string;
          book_subcategory_id: string | null;
          price: number;
          image_url: string | null;
          description: string | null;
          grade: string | null;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          category_id: string;
          book_subcategory_id?: string | null;
          price: number;
          image_url?: string | null;
          description?: string | null;
          grade?: string | null;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          category_id?: string;
          book_subcategory_id?: string | null;
          price?: number;
          image_url?: string | null;
          description?: string | null;
          grade?: string | null;
          is_featured?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_book_subcategory_id_fkey";
            columns: ["book_subcategory_id"];
            isOneToOne: false;
            referencedRelation: "book_subcategories";
            referencedColumns: ["id"];
          },
        ];
      };
      testimonials: {
        Row: {
          id: string;
          name: string;
          role: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          role?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string | null;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          name: string | null;
          phone: string | null;
          message: string;
          source_product_id: string | null;
          status: InquiryStatus;
          source_page: string | null;
          source_type: SourceType | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          phone?: string | null;
          message: string;
          source_product_id?: string | null;
          status?: InquiryStatus;
          source_page?: string | null;
          source_type?: SourceType | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          phone?: string | null;
          message?: string;
          source_product_id?: string | null;
          status?: InquiryStatus;
          source_page?: string | null;
          source_type?: SourceType | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inquiries_source_product_id_fkey";
            columns: ["source_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          title: string;
          message: string;
          type: string;
          metadata: Json;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          message: string;
          type: string;
          metadata?: Json;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          message?: string;
          type?: string;
          metadata?: Json;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversion_events: {
        Row: {
          id: string;
          event_type: string;
          source_page: string | null;
          source_product_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          source_page?: string | null;
          source_product_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          source_page?: string | null;
          source_product_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversion_events_source_product_id_fkey";
            columns: ["source_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_sessions: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: ExamSessionStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: ExamSessionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          status?: ExamSessionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exam_session_prices: {
        Row: {
          id: string;
          session_id: string;
          class_key: ExamClassKey;
          price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          class_key: ExamClassKey;
          price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          class_key?: ExamClassKey;
          price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_session_prices_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "exam_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_orders: {
        Row: {
          id: string;
          order_number: string;
          session_id: string;
          school_name: string;
          contact_person: string;
          phone: string;
          county: string;
          delivery_location: string;
          additional_notes: string | null;
          items: Json;
          total_papers: number;
          total_amount: number;
          status: ExamOrderStatus;
          pdf_storage_path: string | null;
          download_token: string;
          download_token_created_at: string;
          created_at: string;
          updated_at: string;
          pdf_generation_failed: boolean;
          pdf_generation_error: string | null;
          pdf_generation_attempts: number;
          last_pdf_attempt_at: string | null;
          pdf_generated_at: string | null;
        };
        Insert: {
          id?: string;
          order_number: string;
          session_id: string;
          school_name: string;
          contact_person: string;
          phone: string;
          county: string;
          delivery_location: string;
          additional_notes?: string | null;
          items: Json;
          total_papers?: number;
          total_amount?: number;
          status?: ExamOrderStatus;
          pdf_storage_path?: string | null;
          download_token?: string;
          download_token_created_at?: string;
          created_at?: string;
          updated_at?: string;
          pdf_generation_failed?: boolean;
          pdf_generation_error?: string | null;
          pdf_generation_attempts?: number;
          last_pdf_attempt_at?: string | null;
          pdf_generated_at?: string | null;
        };
        Update: {
          id?: string;
          order_number?: string;
          session_id?: string;
          school_name?: string;
          contact_person?: string;
          phone?: string;
          county?: string;
          delivery_location?: string;
          additional_notes?: string | null;
          items?: Json;
          total_papers?: number;
          total_amount?: number;
          status?: ExamOrderStatus;
          pdf_storage_path?: string | null;
          download_token?: string;
          download_token_created_at?: string;
          created_at?: string;
          updated_at?: string;
          pdf_generation_failed?: boolean;
          pdf_generation_error?: string | null;
          pdf_generation_attempts?: number;
          last_pdf_attempt_at?: string | null;
          pdf_generated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exam_orders_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "exam_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_order_counters: {
        Row: {
          year: number;
          last_number: number;
        };
        Insert: {
          year: number;
          last_number?: number;
        };
        Update: {
          year?: number;
          last_number?: number;
        };
        Relationships: [];
      };
      security_events: {
        Row: {
          id: string;
          event_type: string;
          ip: string;
          path: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          ip: string;
          path?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          ip?: string;
          path?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          key: string;
          count: number;
          reset_at: string;
          tokens: number | null;
          last_refilled_at: string | null;
        };
        Insert: {
          key: string;
          count?: number;
          reset_at: string;
          tokens?: number | null;
          last_refilled_at?: string | null;
        };
        Update: {
          key?: string;
          count?: number;
          reset_at?: string;
          tokens?: number | null;
          last_refilled_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      dashboard_top_products_by_events: {
        Args: { limit_n: number };
        Returns: { source_product_id: string; event_count: number }[];
      };
      dashboard_top_products_by_inquiries: {
        Args: { limit_n: number };
        Returns: { source_product_id: string; inquiry_count: number }[];
      };
      dashboard_source_page_breakdown: {
        Args: { limit_n: number };
        Returns: { source_page: string; event_count: number }[];
      };
      generate_exam_order_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: { allowed: boolean; remaining: number; retry_after: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type BookSubcategoryRow = Database["public"]["Tables"]["book_subcategories"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"];
export type InquiryRow = Database["public"]["Tables"]["inquiries"]["Row"];
export type ConversionEventRow = Database["public"]["Tables"]["conversion_events"]["Row"];

/** Product row with nested category and book subcategory. */
export type ProductWithCategory = ProductRow & {
  categories: CategoryRow | null;
  bookSubcategory: BookSubcategoryRow | null;
};
