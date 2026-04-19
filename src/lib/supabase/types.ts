export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'teacher' | 'parent'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'teacher' | 'parent'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'teacher' | 'parent'
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          name: string
          class_name: string | null
          qr_token: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          class_name?: string | null
          qr_token?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          class_name?: string | null
          qr_token?: string
          created_at?: string
        }
      }
      parent_students: {
        Row: {
          parent_id: string
          student_id: string
        }
        Insert: {
          parent_id: string
          student_id: string
        }
        Update: {
          parent_id?: string
          student_id?: string
        }
      }
      attendance_records: {
        Row: {
          id: string
          student_id: string
          date: string
          check_in_at: string
          check_out_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          date: string
          check_in_at: string
          check_out_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          date?: string
          check_in_at?: string
          check_out_at?: string | null
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          body: string
          author_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          author_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          author_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          storage_path: string
          thumbnail_path: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          storage_path: string
          thumbnail_path: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          storage_path?: string
          thumbnail_path?: string
          uploaded_by?: string
          created_at?: string
        }
      }
      public_notices: {
        Row: {
          id: string
          title: string
          body: string
          published_at: string
          author_id: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          published_at?: string
          author_id: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          published_at?: string
          author_id?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
