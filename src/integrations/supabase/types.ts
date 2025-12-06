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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_cheat_sheets: {
        Row: {
          created_at: string
          example_use_cases: string[]
          header_color: string
          icon: string
          id: string
          name: string
          prerequisites: string
          what_is: string
        }
        Insert: {
          created_at?: string
          example_use_cases: string[]
          header_color?: string
          icon: string
          id?: string
          name: string
          prerequisites: string
          what_is: string
        }
        Update: {
          created_at?: string
          example_use_cases?: string[]
          header_color?: string
          icon?: string
          id?: string
          name?: string
          prerequisites?: string
          what_is?: string
        }
        Relationships: []
      }
      choice_submissions: {
        Row: {
          created_at: string
          group_id: string
          id: string
          option_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          option_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          option_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "choice_submissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "choice_submissions_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "choice_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_submissions: {
        Row: {
          ai_score: number | null
          context_score: number | null
          created_at: string
          enhanced_prompt: string | null
          expectation_score: number | null
          feedback: string | null
          goal_score: number | null
          group_id: string
          id: string
          prompt: string
          scenario_id: string
          source_score: number | null
          user_rating: number | null
        }
        Insert: {
          ai_score?: number | null
          context_score?: number | null
          created_at?: string
          enhanced_prompt?: string | null
          expectation_score?: number | null
          feedback?: string | null
          goal_score?: number | null
          group_id: string
          id?: string
          prompt: string
          scenario_id: string
          source_score?: number | null
          user_rating?: number | null
        }
        Update: {
          ai_score?: number | null
          context_score?: number | null
          created_at?: string
          enhanced_prompt?: string | null
          expectation_score?: number | null
          feedback?: string | null
          goal_score?: number | null
          group_id?: string
          id?: string
          prompt?: string
          scenario_id?: string
          source_score?: number | null
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "copilot_submissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copilot_submissions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      group_choices: {
        Row: {
          created_at: string
          group_id: string
          id: string
          option_id: string
          option_name: string | null
          task_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          option_id: string
          option_name?: string | null
          task_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          option_id?: string
          option_name?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_choices_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_choices_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_choices_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      group_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          current_task: number
          group_id: string
          id: string
          is_locked: boolean
          scenario_id: string
          started_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_task?: number
          group_id: string
          id?: string
          is_locked?: boolean
          scenario_id: string
          started_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_task?: number
          group_id?: string
          id?: string
          is_locked?: boolean
          scenario_id?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_progress_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_progress_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      mcq_options: {
        Row: {
          choice_key: string
          created_at: string
          description: string | null
          explanation: string | null
          id: string
          is_correct: boolean | null
          label: string
          question_identifier: string
          task_id: string
        }
        Insert: {
          choice_key: string
          created_at?: string
          description?: string | null
          explanation?: string | null
          id?: string
          is_correct?: boolean | null
          label: string
          question_identifier: string
          task_id: string
        }
        Update: {
          choice_key?: string
          created_at?: string
          description?: string | null
          explanation?: string | null
          id?: string
          is_correct?: boolean | null
          label?: string
          question_identifier?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcq_options_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      mcq_submissions: {
        Row: {
          answers: Json
          created_at: string
          group_id: string
          id: string
          score: number | null
          task_id: string
        }
        Insert: {
          answers: Json
          created_at?: string
          group_id: string
          id?: string
          score?: number | null
          task_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          group_id?: string
          id?: string
          score?: number | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcq_submissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcq_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      option_ai_consideration: {
        Row: {
          created_at: string
          id: string
          option_id: string | null
          reminder_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          option_id?: string | null
          reminder_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string | null
          reminder_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "option_ai_consideration_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "option_ai_consideration_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "responsible_ai_consideration"
            referencedColumns: ["id"]
          },
        ]
      }
      option_cheat_sheets: {
        Row: {
          cheat_sheet_id: string
          created_at: string
          id: string
          option_id: string
        }
        Insert: {
          cheat_sheet_id: string
          created_at?: string
          id?: string
          option_id: string
        }
        Update: {
          cheat_sheet_id?: string
          created_at?: string
          id?: string
          option_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "option_cheat_sheets_cheat_sheet_id_fkey"
            columns: ["cheat_sheet_id"]
            isOneToOne: false
            referencedRelation: "ai_cheat_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "option_cheat_sheets_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
        ]
      }
      options: {
        Row: {
          business_impact_score: number
          cost_label: string | null
          cost_score: number
          created_at: string
          description: string
          feedback: string | null
          icon: string | null
          id: string
          impact_label: string | null
          implications: string[] | null
          is_correct: boolean | null
          speed_label: string | null
          task_id: string
          time_score: number
          title: string
        }
        Insert: {
          business_impact_score: number
          cost_label?: string | null
          cost_score: number
          created_at?: string
          description: string
          feedback?: string | null
          icon?: string | null
          id?: string
          impact_label?: string | null
          implications?: string[] | null
          is_correct?: boolean | null
          speed_label?: string | null
          task_id: string
          time_score: number
          title: string
        }
        Update: {
          business_impact_score?: number
          cost_label?: string | null
          cost_score?: number
          created_at?: string
          description?: string
          feedback?: string | null
          icon?: string | null
          id?: string
          impact_label?: string | null
          implications?: string[] | null
          is_correct?: boolean | null
          speed_label?: string | null
          task_id?: string
          time_score?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "options_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      responsible_ai_consideration: {
        Row: {
          created_at: string
          id: string
          message: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          created_at: string
          description: string
          difficulty: string
          id: string
          image_url: string | null
          name: string
          order_index: number
        }
        Insert: {
          created_at?: string
          description: string
          difficulty: string
          id?: string
          image_url?: string | null
          name: string
          order_index: number
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string
          id?: string
          image_url?: string | null
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: string
          order_index: number
          scenario_id: string
          task_config: Json | null
          task_type: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          order_index: number
          scenario_id: string
          task_config?: Json | null
          task_type?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          order_index?: number
          scenario_id?: string
          task_config?: Json | null
          task_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_submissions: {
        Row: {
          created_at: string
          group_id: string
          id: string
          image_url: string
          task_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          image_url: string
          task_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          image_url?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_submissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upload_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
