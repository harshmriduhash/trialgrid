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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          actor_email: string | null
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          event_type: string
          id: string
          org_id: string
          study_id: string | null
          summary: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_type: string
          id?: string
          org_id: string
          study_id?: string | null
          summary?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_type?: string
          id?: string
          org_id?: string
          study_id?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          extracted_text: string | null
          file_name: string
          id: string
          org_id: string
          page_count: number | null
          storage_key: string | null
          study_id: string
          type: Database["public"]["Enums"]["doc_type"]
          uploaded_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          extracted_text?: string | null
          file_name: string
          id?: string
          org_id: string
          page_count?: number | null
          storage_key?: string | null
          study_id: string
          type: Database["public"]["Enums"]["doc_type"]
          uploaded_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          extracted_text?: string | null
          file_name?: string
          id?: string
          org_id?: string
          page_count?: number | null
          storage_key?: string | null
          study_id?: string
          type?: Database["public"]["Enums"]["doc_type"]
          uploaded_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      grid_lines: {
        Row: {
          ai_suggested: boolean
          confidence: Database["public"]["Enums"]["confidence_level"]
          cpt_code: string | null
          created_at: string
          edited_at: string | null
          edited_by: string | null
          frequency: string | null
          grid_version_id: string
          human_edited: boolean
          id: string
          modifier: string | null
          needs_review: boolean
          org_id: string
          original_cpt_code: string | null
          original_payer: Database["public"]["Enums"]["payer_type"] | null
          payer: Database["public"]["Enums"]["payer_type"]
          position: number
          procedure_name: string
          rationale: string | null
          reviewed: boolean
          rule_citation: string | null
          rule_id: string | null
          source_citation: Json | null
          visit_label: string | null
        }
        Insert: {
          ai_suggested?: boolean
          confidence?: Database["public"]["Enums"]["confidence_level"]
          cpt_code?: string | null
          created_at?: string
          edited_at?: string | null
          edited_by?: string | null
          frequency?: string | null
          grid_version_id: string
          human_edited?: boolean
          id?: string
          modifier?: string | null
          needs_review?: boolean
          org_id: string
          original_cpt_code?: string | null
          original_payer?: Database["public"]["Enums"]["payer_type"] | null
          payer?: Database["public"]["Enums"]["payer_type"]
          position?: number
          procedure_name: string
          rationale?: string | null
          reviewed?: boolean
          rule_citation?: string | null
          rule_id?: string | null
          source_citation?: Json | null
          visit_label?: string | null
        }
        Update: {
          ai_suggested?: boolean
          confidence?: Database["public"]["Enums"]["confidence_level"]
          cpt_code?: string | null
          created_at?: string
          edited_at?: string | null
          edited_by?: string | null
          frequency?: string | null
          grid_version_id?: string
          human_edited?: boolean
          id?: string
          modifier?: string | null
          needs_review?: boolean
          org_id?: string
          original_cpt_code?: string | null
          original_payer?: Database["public"]["Enums"]["payer_type"] | null
          payer?: Database["public"]["Enums"]["payer_type"]
          position?: number
          procedure_name?: string
          rationale?: string | null
          reviewed?: boolean
          rule_citation?: string | null
          rule_id?: string | null
          source_citation?: Json | null
          visit_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grid_lines_grid_version_id_fkey"
            columns: ["grid_version_id"]
            isOneToOne: false
            referencedRelation: "grid_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grid_lines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      grid_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          org_id: string
          rules_version: string
          status: Database["public"]["Enums"]["grid_status"]
          study_id: string
          submitted_at: string | null
          submitted_by: string | null
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id: string
          rules_version?: string
          status?: Database["public"]["Enums"]["grid_status"]
          study_id: string
          submitted_at?: string | null
          submitted_by?: string | null
          version_number: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          rules_version?: string
          status?: Database["public"]["Enums"]["grid_status"]
          study_id?: string
          submitted_at?: string | null
          submitted_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "grid_versions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grid_versions_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      ncd_rules: {
        Row: {
          citation: string
          created_at: string
          default_payer: Database["public"]["Enums"]["payer_type"]
          description: string
          effective_date: string
          id: string
          rule_version: string
          title: string
        }
        Insert: {
          citation: string
          created_at?: string
          default_payer: Database["public"]["Enums"]["payer_type"]
          description: string
          effective_date: string
          id: string
          rule_version: string
          title: string
        }
        Update: {
          citation?: string
          created_at?: string
          default_payer?: Database["public"]["Enums"]["payer_type"]
          description?: string
          effective_date?: string
          id?: string
          rule_version?: string
          title?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      pilot_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          institution: string
          message: string | null
          name: string
          role: string | null
          studies_per_year: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          institution: string
          message?: string | null
          name: string
          role?: string | null
          studies_per_year?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          institution?: string
          message?: string | null
          name?: string
          role?: string | null
          studies_per_year?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          deactivated_at: string | null
          email: string
          full_name: string | null
          id: string
          org_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          email: string
          full_name?: string | null
          id: string
          org_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          org_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      studies: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_qct: boolean
          org_id: string
          phase: string | null
          protocol_number: string
          sponsor: string | null
          status: Database["public"]["Enums"]["study_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_qct?: boolean
          org_id: string
          phase?: string | null
          protocol_number: string
          sponsor?: string | null
          status?: Database["public"]["Enums"]["study_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_qct?: boolean
          org_id?: string
          phase?: string | null
          protocol_number?: string
          sponsor?: string | null
          status?: Database["public"]["Enums"]["study_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          org_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_approve: { Args: { _user_id: string }; Returns: boolean }
      current_org_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "approver" | "analyst"
      confidence_level: "high" | "medium" | "low"
      doc_type: "protocol" | "icf" | "budget"
      grid_status: "draft" | "submitted" | "approved" | "superseded"
      payer_type: "medicare" | "sponsor" | "patient" | "unassigned"
      study_status: "draft" | "in_review" | "approved"
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
      app_role: ["admin", "approver", "analyst"],
      confidence_level: ["high", "medium", "low"],
      doc_type: ["protocol", "icf", "budget"],
      grid_status: ["draft", "submitted", "approved", "superseded"],
      payer_type: ["medicare", "sponsor", "patient", "unassigned"],
      study_status: ["draft", "in_review", "approved"],
    },
  },
} as const
