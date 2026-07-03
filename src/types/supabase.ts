export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          avatar_url: string | null
          weight: number | null
          height: number | null
          age: number | null
          gender: string | null
          goal: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          weight?: number | null
          height?: number | null
          goal?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          weight?: number | null
          height?: number | null
          goal?: string | null
        }
      }
      diet_plans: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          description: string | null
          calories: number | null
          protein: number | null
          carbs: number | null
          fat: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          description?: string | null
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fat?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          description?: string | null
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fat?: number | null
        }
      }
      exercise_plans: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          description: string | null
          duration: number | null
          difficulty: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          description?: string | null
          duration?: number | null
          difficulty?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          description?: string | null
          duration?: number | null
          difficulty?: string | null
        }
      }
      progress_logs: {
        Row: {
          id: string
          created_at: string
          user_id: string
          weight: number | null
          notes: string | null
          mood: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          weight?: number | null
          notes?: string | null
          mood?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          weight?: number | null
          notes?: string | null
          mood?: string | null
        }
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
  }
}