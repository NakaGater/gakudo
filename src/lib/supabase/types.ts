export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'parent' | 'teacher' | 'admin' | 'entrance'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'parent' | 'teacher' | 'admin' | 'entrance'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'parent' | 'teacher' | 'admin' | 'entrance'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      children: {
        Row: {
          id: string
          name: string
          grade: number
          qr_code: string
          qr_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          grade: number
          qr_code: string
          qr_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          grade?: number
          qr_code?: string
          qr_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      child_parents: {
        Row: {
          child_id: string
          parent_id: string
        }
        Insert: {
          child_id: string
          parent_id: string
        }
        Update: {
          child_id?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_parents_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      attendances: {
        Row: {
          id: string
          child_id: string
          type: 'enter' | 'exit'
          method: 'qr' | 'manual'
          recorded_at: string
          recorded_by: string | null
        }
        Insert: {
          id?: string
          child_id: string
          type: 'enter' | 'exit'
          method: 'qr' | 'manual'
          recorded_at?: string
          recorded_by?: string | null
        }
        Update: {
          id?: string
          child_id?: string
          type?: 'enter' | 'exit'
          method?: 'qr' | 'manual'
          recorded_at?: string
          recorded_by?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          title: string
          body: string
          posted_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          posted_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          posted_by?: string
          created_at?: string
        }
        Relationships: []
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          user_id: string
          read_at: string
        }
        Insert: {
          announcement_id: string
          user_id: string
          read_at?: string
        }
        Update: {
          announcement_id?: string
          user_id?: string
          read_at?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          id: string
          storage_path: string
          thumbnail_path: string | null
          caption: string | null
          event_name: string | null
          visibility: 'private' | 'public'
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          storage_path: string
          thumbnail_path?: string | null
          caption?: string | null
          event_name?: string | null
          visibility?: 'private' | 'public'
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          storage_path?: string
          thumbnail_path?: string | null
          caption?: string | null
          event_name?: string | null
          visibility?: 'private' | 'public'
          uploaded_by?: string
          created_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          title: string
          file_path: string
          category: string
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          file_path: string
          category: string
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          file_path?: string
          category?: string
          uploaded_by?: string
          created_at?: string
        }
        Relationships: []
      }
      billing_rules: {
        Row: {
          id: string
          regular_end_time: string
          rate_per_unit: number
          unit_minutes: number
          effective_from: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          regular_end_time: string
          rate_per_unit: number
          unit_minutes?: number
          effective_from: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          regular_end_time?: string
          rate_per_unit?: number
          unit_minutes?: number
          effective_from?: string
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      monthly_bills: {
        Row: {
          id: string
          child_id: string
          year_month: string
          total_extended_minutes: number
          total_amount: number
          status: 'draft' | 'confirmed'
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          child_id: string
          year_month: string
          total_extended_minutes?: number
          total_amount?: number
          status?: 'draft' | 'confirmed'
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          child_id?: string
          year_month?: string
          total_extended_minutes?: number
          total_amount?: number
          status?: 'draft' | 'confirmed'
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_bills_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          }
        ]
      }
      site_pages: {
        Row: {
          id: string
          slug: string
          title: string
          content: string
          metadata: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          slug: string
          title: string
          content: string
          metadata?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          content?: string
          metadata?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_news: {
        Row: {
          id: string
          title: string
          body: string
          published_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          body: string
          published_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          body?: string
          published_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      attachments: {
        Row: {
          id: string
          entity_type: 'announcement' | 'news'
          entity_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: 'announcement' | 'news'
          entity_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: 'announcement' | 'news'
          entity_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          user_id: string
          method: 'push' | 'email' | 'both' | 'off'
        }
        Insert: {
          user_id: string
          method?: 'push' | 'email' | 'both' | 'off'
        }
        Update: {
          user_id?: string
          method?: 'push' | 'email' | 'both' | 'off'
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          subscription: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription?: Json
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
