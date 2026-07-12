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
          weekly_weight_change: number | null
          activity_level: string | null
          target_weight: number | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          weight?: number | null
          height?: number | null
          age?: number | null
          gender?: string | null
          goal?: string | null
          weekly_weight_change?: number | null
          activity_level?: string | null
          target_weight?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          weight?: number | null
          height?: number | null
          age?: number | null
          gender?: string | null
          goal?: string | null
          weekly_weight_change?: number | null
          activity_level?: string | null
          target_weight?: number | null
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
      daily_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          water_ml: number
          extra_calories: number
          extra_protein: number
          extra_carbs: number
          extra_fat: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          water_ml?: number
          extra_calories?: number
          extra_protein?: number
          extra_carbs?: number
          extra_fat?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          water_ml?: number
          extra_calories?: number
          extra_protein?: number
          extra_carbs?: number
          extra_fat?: number
          updated_at?: string
        }
      }
      plan_completions: {
        Row: {
          id: string
          user_id: string
          log_date: string
          item_type: 'meal' | 'workout'
          item_key: string
          item_name: string
          calories: number
          protein: number
          carbs: number
          fat: number
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          item_type: 'meal' | 'workout'
          item_key: string
          item_name: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          item_type?: 'meal' | 'workout'
          item_key?: string
          item_name?: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          completed_at?: string
        }
      }
      health_metrics: {
        Row: {
          id: string
          user_id: string
          log_date: string
          metric_type: string
          value: number
          source: string
          recorded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          metric_type: string
          value: number
          source?: string
          recorded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          metric_type?: string
          value?: number
          source?: string
          recorded_at?: string
        }
      }
      device_connections: {
        Row: {
          id: string
          user_id: string
          provider: string
          status: string
          connected_at: string
          last_sync_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          status?: string
          connected_at?: string
          last_sync_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          status?: string
          connected_at?: string
          last_sync_at?: string | null
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
          last_used_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          created_at?: string
          last_used_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          user_agent?: string | null
          created_at?: string
          last_used_at?: string | null
        }
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          exercise_key: string
          started_at: string
          duration_seconds: number
          total_reps: number
          avg_form_score: number | null
          rep_scores: Json
          feedback: Json
          source: string
          calories: number | null
          exercises: Json
          log_date: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_key: string
          started_at?: string
          duration_seconds?: number
          total_reps?: number
          avg_form_score?: number | null
          rep_scores?: Json
          feedback?: Json
          source?: string
          calories?: number | null
          exercises?: Json
          log_date?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_key?: string
          started_at?: string
          duration_seconds?: number
          total_reps?: number
          avg_form_score?: number | null
          rep_scores?: Json
          feedback?: Json
          source?: string
          calories?: number | null
          exercises?: Json
          log_date?: string
        }
      }
      saved_foods: {
        Row: {
          id: string
          user_id: string
          created_at: string
          name: string
          brand: string | null
          barcode: string | null
          serving_desc: string | null
          calories: number
          protein: number
          carbs: number
          fat: number
          micronutrients: Json
          source: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          name: string
          brand?: string | null
          barcode?: string | null
          serving_desc?: string | null
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          micronutrients?: Json
          source?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          name?: string
          brand?: string | null
          barcode?: string | null
          serving_desc?: string | null
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          micronutrients?: Json
          source?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          settings: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          user_id?: string
          settings?: Json
          updated_at?: string
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