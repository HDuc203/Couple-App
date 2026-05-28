export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      bucket_list: {
        Row: {
          id: string;
          couple_id: string | null;
          created_by: string | null;
          title: string;
          description: string | null;
          is_completed: boolean | null;
          completed_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id?: string | null;
          created_by?: string | null;
          title: string;
          description?: string | null;
          is_completed?: boolean | null;
          completed_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string | null;
          created_by?: string | null;
          title?: string;
          description?: string | null;
          is_completed?: boolean | null;
          completed_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      couple_members: {
        Row: {
          id: string;
          couple_id: string | null;
          user_id: string | null;
          role: string | null;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id?: string | null;
          user_id?: string | null;
          role?: string | null;
          joined_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string | null;
          user_id?: string | null;
          role?: string | null;
          joined_at?: string | null;
        };
        Relationships: [];
      };
      couples: {
        Row: {
          id: string;
          owner_id: string | null;
          invite_code: string;
          love_start_date: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          invite_code: string;
          love_start_date?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          invite_code?: string;
          love_start_date?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      diary_entries: {
        Row: {
          id: string;
          couple_id: string | null;
          author_id: string | null;
          title: string | null;
          content: string;
          is_private: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id?: string | null;
          author_id?: string | null;
          title?: string | null;
          content: string;
          is_private?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string | null;
          author_id?: string | null;
          title?: string | null;
          content?: string;
          is_private?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      love_notes: {
        Row: {
          id: string;
          couple_id: string | null;
          sender_id: string | null;
          receiver_id: string | null;
          message: string;
          reveal_at: string | null;
          is_read: boolean | null;
          is_hidden: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id?: string | null;
          sender_id?: string | null;
          receiver_id?: string | null;
          message: string;
          reveal_at?: string | null;
          is_read?: boolean | null;
          is_hidden?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string | null;
          sender_id?: string | null;
          receiver_id?: string | null;
          message?: string;
          reveal_at?: string | null;
          is_read?: boolean | null;
          is_hidden?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      mood_logs: {
        Row: {
          id: string;
          user_id: string | null;
          couple_id: string | null;
          mood: string;
          note: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          couple_id?: string | null;
          mood: string;
          note?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          couple_id?: string | null;
          mood?: string;
          note?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      period_logs: {
        Row: {
          id: string;
          user_id: string | null;
          start_date: string;
          end_date: string | null;
          symptoms: string[] | null;
          note: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          start_date: string;
          end_date?: string | null;
          symptoms?: string[] | null;
          note?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          start_date?: string;
          end_date?: string | null;
          symptoms?: string[] | null;
          note?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      photo_albums: {
        Row: {
          id: string;
          couple_id: string | null;
          title: string;
          created_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id?: string | null;
          title: string;
          created_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string | null;
          title?: string;
          created_by?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          album_id: string | null;
          couple_id: string | null;
          uploaded_by: string | null;
          image_url: string;
          caption: string | null;
          location: string | null;
          taken_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          album_id?: string | null;
          couple_id?: string | null;
          uploaded_by?: string | null;
          image_url: string;
          caption?: string | null;
          location?: string | null;
          taken_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          album_id?: string | null;
          couple_id?: string | null;
          uploaded_by?: string | null;
          image_url?: string;
          caption?: string | null;
          location?: string | null;
          taken_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          display_name: string;
          nickname: string | null;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          birthday: string | null;
          gender: string | null;
          period_tracking_enabled: boolean | null;
          theme_preference: string | null;
          onboarding_completed: boolean;
          created_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          display_name: string;
          nickname?: string | null;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          birthday?: string | null;
          gender?: string | null;
          period_tracking_enabled?: boolean | null;
          theme_preference?: string | null;
          onboarding_completed?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          display_name?: string;
          nickname?: string | null;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          birthday?: string | null;
          gender?: string | null;
          period_tracking_enabled?: boolean | null;
          theme_preference?: string | null;
          onboarding_completed?: boolean;
          created_at?: string | null;
        };
        Relationships: [];
      };
      wishlists: {
        Row: {
          id: string;
          couple_id: string | null;
          created_by: string | null;
          title: string;
          note: string | null;
          is_completed: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id?: string | null;
          created_by?: string | null;
          title: string;
          note?: string | null;
          is_completed?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string | null;
          created_by?: string | null;
          title?: string;
          note?: string | null;
          is_completed?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      special_dates: {
        Row: {
          id: string;
          couple_id: string | null;
          title: string;
          type: string;
          date: string;
          description: string | null;
          repeat_yearly: boolean;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id?: string | null;
          title: string;
          type: string;
          date: string;
          description?: string | null;
          repeat_yearly?: boolean;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string | null;
          title?: string;
          type?: string;
          date?: string;
          description?: string | null;
          repeat_yearly?: boolean;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      period_tracking: {
        Row: {
          id: string;
          user_id: string | null;
          last_period_date: string;
          cycle_length: number;
          period_length: number;
          notifications_enabled: boolean;
          share_with_partner: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          last_period_date: string;
          cycle_length?: number;
          period_length?: number;
          notifications_enabled?: boolean;
          share_with_partner?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          last_period_date?: string;
          cycle_length?: number;
          period_length?: number;
          notifications_enabled?: boolean;
          share_with_partner?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      relationship_timeline: {
        Row: {
          id: string;
          couple_id: string | null;
          event_type: string;
          reference_id: string | null;
          title: string;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id?: string | null;
          event_type: string;
          reference_id?: string | null;
          title: string;
          description?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string | null;
          event_type?: string;
          reference_id?: string | null;
          title?: string;
          description?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      love_note_reactions: {
        Row: {
          id: string;
          love_note_id: string;
          user_id: string;
          reaction_type: "heart" | "hug_back" | "touched" | "gentle";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          love_note_id: string;
          user_id: string;
          reaction_type: "heart" | "hug_back" | "touched" | "gentle";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          love_note_id?: string;
          user_id?: string;
          reaction_type?: "heart" | "hug_back" | "touched" | "gentle";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          couple_id: string | null;
          user_id: string | null;
          sender_id: string | null;
          type: string;
          title: string;
          content: string;
          is_read: boolean | null;
          link: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          couple_id?: string | null;
          user_id?: string | null;
          sender_id?: string | null;
          type: string;
          title: string;
          content: string;
          is_read?: boolean | null;
          link?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          couple_id?: string | null;
          user_id?: string | null;
          sender_id?: string | null;
          type?: string;
          title?: string;
          content?: string;
          is_read?: boolean | null;
          link?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      dismissed_reminders: {
        Row: {
          id: string;
          user_id: string;
          reminder_key: string;
          dismissed_until: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          reminder_key: string;
          dismissed_until: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          reminder_key?: string;
          dismissed_until?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: {
      join_couple_by_invite_code: {
        Args: {
          invite_code_input: string;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Update"];
