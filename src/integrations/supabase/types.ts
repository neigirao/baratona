export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_key: string
          id: string
          participant_id: string
          unlocked_at: string
        }
        Insert: {
          achievement_key: string
          id?: string
          participant_id: string
          unlocked_at?: string
        }
        Update: {
          achievement_key?: string
          id?: string
          participant_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          broadcast_msg: string | null
          current_bar_id: number | null
          destination_bar_id: number | null
          global_delay_minutes: number
          id: number
          origin_bar_id: number | null
          status: string
          updated_at: string
        }
        Insert: {
          broadcast_msg?: string | null
          current_bar_id?: number | null
          destination_bar_id?: number | null
          global_delay_minutes?: number
          id?: number
          origin_bar_id?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          broadcast_msg?: string | null
          current_bar_id?: number | null
          destination_bar_id?: number | null
          global_delay_minutes?: number
          id?: number
          origin_bar_id?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_config_current_bar_id_fkey"
            columns: ["current_bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_config_destination_bar_id_fkey"
            columns: ["destination_bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_config_origin_bar_id_fkey"
            columns: ["origin_bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      bars: {
        Row: {
          address: string
          bar_order: number
          id: number
          latitude: number | null
          longitude: number | null
          name: string
          scheduled_time: string
        }
        Insert: {
          address: string
          bar_order: number
          id: number
          latitude?: number | null
          longitude?: number | null
          name: string
          scheduled_time: string
        }
        Update: {
          address?: string
          bar_order?: number
          id?: number
          latitude?: number | null
          longitude?: number | null
          name?: string
          scheduled_time?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          bar_id: number
          checked_in_at: string
          id: string
          participant_id: string
        }
        Insert: {
          bar_id: number
          checked_in_at?: string
          id?: string
          participant_id: string
        }
        Update: {
          bar_id?: number
          checked_in_at?: string
          id?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      consumption: {
        Row: {
          bar_id: number | null
          count: number
          id: string
          participant_id: string
          subtype: string | null
          type: string
          updated_at: string
        }
        Insert: {
          bar_id?: number | null
          count?: number
          id?: string
          participant_id: string
          subtype?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          bar_id?: number | null
          count?: number
          id?: string
          participant_id?: string
          subtype?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumption_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumption_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      event_achievements: {
        Row: {
          achievement_key: string
          event_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          event_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          event_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_achievements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_app_config: {
        Row: {
          broadcast_msg: string | null
          current_bar_id: string | null
          destination_bar_id: string | null
          event_id: string
          global_delay_minutes: number
          id: string
          origin_bar_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          broadcast_msg?: string | null
          current_bar_id?: string | null
          destination_bar_id?: string | null
          event_id: string
          global_delay_minutes?: number
          id?: string
          origin_bar_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          broadcast_msg?: string | null
          current_bar_id?: string | null
          destination_bar_id?: string | null
          event_id?: string
          global_delay_minutes?: number
          id?: string
          origin_bar_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_app_config_current_bar_id_fkey"
            columns: ["current_bar_id"]
            isOneToOne: false
            referencedRelation: "event_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_app_config_destination_bar_id_fkey"
            columns: ["destination_bar_id"]
            isOneToOne: false
            referencedRelation: "event_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_app_config_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_app_config_origin_bar_id_fkey"
            columns: ["origin_bar_id"]
            isOneToOne: false
            referencedRelation: "event_bars"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bar_favorites: {
        Row: {
          bar_id: string
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bar_favorites_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "event_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bar_favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bars: {
        Row: {
          address: string
          bar_order: number
          created_at: string
          dish_description: string | null
          dish_image_url: string | null
          event_id: string
          external_id: string | null
          featured_dish: string | null
          id: string
          instagram: string | null
          latitude: number | null
          longitude: number | null
          name: string
          neighborhood: string | null
          phone: string | null
          scheduled_time: string | null
        }
        Insert: {
          address?: string
          bar_order?: number
          created_at?: string
          dish_description?: string | null
          dish_image_url?: string | null
          event_id: string
          external_id?: string | null
          featured_dish?: string | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          phone?: string | null
          scheduled_time?: string | null
        }
        Update: {
          address?: string
          bar_order?: number
          created_at?: string
          dish_description?: string | null
          dish_image_url?: string | null
          event_id?: string
          external_id?: string | null
          featured_dish?: string | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          phone?: string | null
          scheduled_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_bars_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checkins: {
        Row: {
          bar_id: string
          checked_in_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          bar_id: string
          checked_in_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          bar_id?: string
          checked_in_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checkins_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "event_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_checkins_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_consumption: {
        Row: {
          bar_id: string | null
          count: number
          event_id: string
          id: string
          subtype: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bar_id?: string | null
          count?: number
          event_id: string
          id?: string
          subtype?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bar_id?: string | null
          count?: number
          event_id?: string
          id?: string
          subtype?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_consumption_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "event_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_consumption_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_invites: {
        Row: {
          code: string
          created_at: string
          event_id: string
          expires_at: string | null
          id: string
          max_uses: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          event_id: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_invites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_members: {
        Row: {
          created_at: string
          display_name: string | null
          event_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          event_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          event_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_votes: {
        Row: {
          bar_id: string
          created_at: string
          dish_score: number | null
          drink_score: number | null
          event_id: string
          food_score: number | null
          id: string
          service_score: number | null
          user_id: string
          vibe_score: number | null
        }
        Insert: {
          bar_id: string
          created_at?: string
          dish_score?: number | null
          drink_score?: number | null
          event_id: string
          food_score?: number | null
          id?: string
          service_score?: number | null
          user_id: string
          vibe_score?: number | null
        }
        Update: {
          bar_id?: string
          created_at?: string
          dish_score?: number | null
          drink_score?: number | null
          event_id?: string
          food_score?: number | null
          id?: string
          service_score?: number | null
          user_id?: string
          vibe_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_votes_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "event_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_votes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          city: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          end_date: string | null
          event_date: string | null
          event_type: string
          external_source_url: string | null
          id: string
          name: string
          owner_name: string | null
          owner_user_id: string
          slug: string
          start_date: string | null
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date?: string | null
          event_type?: string
          external_source_url?: string | null
          id?: string
          name: string
          owner_name?: string | null
          owner_user_id: string
          slug: string
          start_date?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date?: string | null
          event_type?: string
          external_source_url?: string | null
          id?: string
          name?: string
          owner_name?: string | null
          owner_user_id?: string
          slug?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          name?: string
        }
        Relationships: []
      }
      platform_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          bar_id: number
          created_at: string
          drink_score: number
          food_score: number
          id: string
          participant_id: string
          service_score: number
          vibe_score: number
        }
        Insert: {
          bar_id: number
          created_at?: string
          drink_score: number
          food_score: number
          id?: string
          participant_id: string
          service_score: number
          vibe_score: number
        }
        Update: {
          bar_id?: number
          created_at?: string
          drink_score?: number
          food_score?: number
          id?: string
          participant_id?: string
          service_score?: number
          vibe_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_all_events: {
        Args: never
        Returns: {
          bar_count: number
          city: string
          cover_image_url: string
          created_at: string
          description: string
          end_date: string
          event_date: string
          event_type: string
          external_source_url: string
          id: string
          member_count: number
          name: string
          owner_name: string
          owner_user_id: string
          slug: string
          start_date: string
          status: string
          updated_at: string
          visibility: string
        }[]
      }
      admin_list_platform_roles: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          role: string
          user_id: string
        }[]
      }
      admin_remove_platform_role: {
        Args: { _role: string; _user_id: string }
        Returns: undefined
      }
      admin_set_platform_role: {
        Args: { _role: string; _user_id: string }
        Returns: undefined
      }
      admin_update_event_owner: {
        Args: { _event_id: string; _new_owner: string }
        Returns: undefined
      }
      create_baratona_from_favorites: {
        Args: { _bar_ids: string[]; _name: string; _source_event_id: string }
        Returns: {
          event_id: string
          slug: string
        }[]
      }
      get_bar_favorite_counts: {
        Args: { _event_id: string }
        Returns: {
          bar_id: string
          fav_count: number
        }[]
      }
      get_event_member_count: { Args: { _event_id: string }; Returns: number }
      get_public_events_with_counts: {
        Args: never
        Returns: {
          bar_count: number
          city: string
          cover_image_url: string
          created_at: string
          description: string
          end_date: string
          event_date: string
          event_type: string
          external_source_url: string
          id: string
          member_count: number
          name: string
          owner_name: string
          owner_user_id: string
          slug: string
          start_date: string
          status: string
          updated_at: string
          visibility: string
        }[]
      }
      has_platform_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      redeem_event_invite: {
        Args: { _code: string; _display_name: string }
        Returns: {
          event_id: string
          slug: string
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
