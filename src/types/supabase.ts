// src/types/supabase.ts - Database Types (Generate with: supabase gen types typescript)
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
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      daily_stats: {
        Row: {
          id: string
          user_id: string
          date: string
          total_sessions: number
          completed_sessions: number
          total_work_time: number
          total_break_time: number
          tasks_completed: number
          intensity_level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          total_sessions?: number
          completed_sessions?: number
          total_work_time?: number
          total_break_time?: number
          tasks_completed?: number
          intensity_level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          total_sessions?: number
          completed_sessions?: number
          total_work_time?: number
          total_break_time?: number
          tasks_completed?: number
          intensity_level?: number
          created_at?: string
          updated_at?: string
        }
      }
      playlists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean
          spotify_id: string | null
          tracks: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean
          spotify_id?: string | null
          tracks?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_public?: boolean
          spotify_id?: string | null
          tracks?: Json
          created_at?: string
          updated_at?: string
        }
      }
      pomodoro_sessions: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          session_type: string
          planned_duration: number
          actual_duration: number | null
          completed: boolean
          started_at: string
          completed_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          session_type: string
          planned_duration: number
          actual_duration?: number | null
          completed?: boolean
          started_at?: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          session_type?: string
          planned_duration?: number
          actual_duration?: number | null
          completed?: boolean
          started_at?: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      spotify_tokens: {
        Row: {
          id: string
          user_id: string
          access_token: string | null
          refresh_token: string | null
          expires_at: string | null
          scope: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          scope?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: string | null
          scope?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          completed: boolean
          priority: number
          estimated_pomodoros: number
          completed_pomodoros: number
          project: string | null
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
          order_index: number
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          completed?: boolean
          priority?: number
          estimated_pomodoros?: number
          completed_pomodoros?: number
          project?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          order_index?: number
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          completed?: boolean
          priority?: number
          estimated_pomodoros?: number
          completed_pomodoros?: number
          project?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          order_index?: number
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          work_duration: number
          short_break_duration: number
          long_break_duration: number
          sessions_until_long_break: number
          auto_start_breaks: boolean
          auto_start_pomodoros: boolean
          theme: string
          notification_sound: string
          break_sound: string
          master_volume: number
          notification_volume: number
          music_volume: number
          ambient_volume: number
          spotify_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          work_duration?: number
          short_break_duration?: number
          long_break_duration?: number
          sessions_until_long_break?: number
          auto_start_breaks?: boolean
          auto_start_pomodoros?: boolean
          theme?: string
          notification_sound?: string
          break_sound?: string
          master_volume?: number
          notification_volume?: number
          music_volume?: number
          ambient_volume?: number
          spotify_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          work_duration?: number
          short_break_duration?: number
          long_break_duration?: number
          sessions_until_long_break?: number
          auto_start_breaks?: boolean
          auto_start_pomodoros?: boolean
          theme?: string
          notification_sound?: string
          break_sound?: string
          master_volume?: number
          notification_volume?: number
          music_volume?: number
          ambient_volume?: number
          spotify_enabled?: boolean
          created_at?: string
          updated_at?: string
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