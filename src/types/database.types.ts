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
      rooms: {
        Row: {
          id: string
          code: string
          status: 'waiting' | 'active' | 'finished'
          game_length: number
          current_level: number
          score: number
          turn_player: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          status?: 'waiting' | 'active' | 'finished'
          game_length?: number
          current_level?: number
          score?: number
          turn_player?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          status?: 'waiting' | 'active' | 'finished'
          game_length?: number
          current_level?: number
          score?: number
          turn_player?: string | null
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          room_id: string
          device_id: string
          role: 'host' | 'guest'
          nickname: string | null
          auth_uid: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          room_id: string
          device_id: string
          role: 'host' | 'guest'
          nickname?: string | null
          auth_uid?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          device_id?: string
          role?: 'host' | 'guest'
          nickname?: string | null
          auth_uid?: string | null
          joined_at?: string
        }
      }
      turns: {
        Row: {
          id: string
          room_id: string
          actor_player: string
          answers_turn_id: string | null
          answer_text: string | null
          answer_pose_id: string | null
          answer_variant: string | null
          answer_media_url: string | null
          new_question_id: string | null
          new_question_text: string
          level: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          actor_player: string
          answers_turn_id?: string | null
          answer_text?: string | null
          answer_pose_id?: string | null
          answer_variant?: string | null
          answer_media_url?: string | null
          new_question_id?: string | null
          new_question_text: string
          level: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          actor_player?: string
          answers_turn_id?: string | null
          answer_text?: string | null
          answer_pose_id?: string | null
          answer_variant?: string | null
          answer_media_url?: string | null
          new_question_id?: string | null
          new_question_text?: string
          level?: number
          created_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          room_id: string
          turn_id: string
          marked_by: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          turn_id: string
          marked_by: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          turn_id?: string
          marked_by?: string
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string
          favorite_id: string | null
          sender: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          favorite_id?: string | null
          sender: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          favorite_id?: string | null
          sender?: string
          body?: string
          created_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
