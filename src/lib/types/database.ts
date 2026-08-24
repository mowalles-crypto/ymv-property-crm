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
      customers: {
        Row: {
          created_at: string
          customer_name: string
          customer_status: Database["public"]["Enums"]["customer_status"]
          email: string
          id: string
          phone_1: string
          phone_2: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_status?: Database["public"]["Enums"]["customer_status"]
          email: string
          id?: string
          phone_1: string
          phone_2?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_status?: Database["public"]["Enums"]["customer_status"]
          email?: string
          id?: string
          phone_1?: string
          phone_2?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          bank_financing: number
          bank_financing_end_date: string | null
          created_at: string
          customer_id: string
          equity_paid: number
          id: string
          key_received_date: string | null
          monthly_rent: number | null
          notes: string | null
          property_address: string
          property_status: Database["public"]["Enums"]["property_status"]
          purchase_date: string | null
          purchase_price: number | null
          rental_end_date: string | null
          sale_date: string | null
          sale_price: number | null
          updated_at: string
        }
        Insert: {
          bank_financing?: number
          bank_financing_end_date?: string | null
          created_at?: string
          customer_id: string
          equity_paid?: number
          id?: string
          key_received_date?: string | null
          monthly_rent?: number | null
          notes?: string | null
          property_address: string
          property_status?: Database["public"]["Enums"]["property_status"]
          purchase_date?: string | null
          purchase_price?: number | null
          rental_end_date?: string | null
          sale_date?: string | null
          sale_price?: number | null
          updated_at?: string
        }
        Update: {
          bank_financing?: number
          bank_financing_end_date?: string | null
          created_at?: string
          customer_id?: string
          equity_paid?: number
          id?: string
          key_received_date?: string | null
          monthly_rent?: number | null
          notes?: string | null
          property_address?: string
          property_status?: Database["public"]["Enums"]["property_status"]
          purchase_date?: string | null
          purchase_price?: number | null
          rental_end_date?: string | null
          sale_date?: string | null
          sale_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      property_accounting: {
        Row: {
          created_at: string
          expense_1: number
          expense_1_description: string | null
          expense_2: number
          expense_2_description: string | null
          expense_3: number
          expense_3_description: string | null
          expense_4: number
          expense_4_description: string | null
          expense_5: number
          expense_5_description: string | null
          id: string
          month: number
          notes: string | null
          profit: number | null
          property_id: string
          rent_received: number
          total_expenses: number | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          expense_1?: number
          expense_1_description?: string | null
          expense_2?: number
          expense_2_description?: string | null
          expense_3?: number
          expense_3_description?: string | null
          expense_4?: number
          expense_4_description?: string | null
          expense_5?: number
          expense_5_description?: string | null
          id?: string
          month: number
          notes?: string | null
          profit?: number | null
          property_id: string
          rent_received?: number
          total_expenses?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          expense_1?: number
          expense_1_description?: string | null
          expense_2?: number
          expense_2_description?: string | null
          expense_3?: number
          expense_3_description?: string | null
          expense_4?: number
          expense_4_description?: string | null
          expense_5?: number
          expense_5_description?: string | null
          id?: string
          month?: number
          notes?: string | null
          profit?: number | null
          property_id?: string
          rent_received?: number
          total_expenses?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_accounting_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_requirements: {
        Row: {
          additional_requirements: string | null
          available_equity: number | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          customer_id: string
          desired_yield: number | null
          financing_amount: number | null
          financing_percentage: number | null
          financing_required: Database["public"]["Enums"]["financing_requirement"]
          id: string
          other_preferences: string | null
          preferred_floor: string | null
          preferred_locations: string[]
          property_condition: Database["public"]["Enums"]["property_condition"]
          property_types: Database["public"]["Enums"]["property_type"][]
          purchase_purpose: Database["public"]["Enums"]["purchase_purpose"]
          purchase_timeline: Database["public"]["Enums"]["purchase_timeline"]
          rooms_max: number | null
          rooms_min: number | null
          size_max: number | null
          size_min: number | null
          updated_at: string
          wants_accessibility: boolean
          wants_balcony: boolean
          wants_elevator: boolean
          wants_parking: boolean
          wants_public_transport_proximity: boolean
          wants_storage: boolean
        }
        Insert: {
          additional_requirements?: string | null
          available_equity?: number | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          customer_id: string
          desired_yield?: number | null
          financing_amount?: number | null
          financing_percentage?: number | null
          financing_required?: Database["public"]["Enums"]["financing_requirement"]
          id?: string
          other_preferences?: string | null
          preferred_floor?: string | null
          preferred_locations?: string[]
          property_condition?: Database["public"]["Enums"]["property_condition"]
          property_types?: Database["public"]["Enums"]["property_type"][]
          purchase_purpose: Database["public"]["Enums"]["purchase_purpose"]
          purchase_timeline: Database["public"]["Enums"]["purchase_timeline"]
          rooms_max?: number | null
          rooms_min?: number | null
          size_max?: number | null
          size_min?: number | null
          updated_at?: string
          wants_accessibility?: boolean
          wants_balcony?: boolean
          wants_elevator?: boolean
          wants_parking?: boolean
          wants_public_transport_proximity?: boolean
          wants_storage?: boolean
        }
        Update: {
          additional_requirements?: string | null
          available_equity?: number | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          customer_id?: string
          desired_yield?: number | null
          financing_amount?: number | null
          financing_percentage?: number | null
          financing_required?: Database["public"]["Enums"]["financing_requirement"]
          id?: string
          other_preferences?: string | null
          preferred_floor?: string | null
          preferred_locations?: string[]
          property_condition?: Database["public"]["Enums"]["property_condition"]
          property_types?: Database["public"]["Enums"]["property_type"][]
          purchase_purpose?: Database["public"]["Enums"]["purchase_purpose"]
          purchase_timeline?: Database["public"]["Enums"]["purchase_timeline"]
          rooms_max?: number | null
          rooms_min?: number | null
          size_max?: number | null
          size_min?: number | null
          updated_at?: string
          wants_accessibility?: boolean
          wants_balcony?: boolean
          wants_elevator?: boolean
          wants_parking?: boolean
          wants_public_transport_proximity?: boolean
          wants_storage?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "property_requirements_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_client_registration: {
        Args: {
          p_additional_requirements: string
          p_available_equity: number
          p_budget_max: number
          p_budget_min: number
          p_customer_name: string
          p_desired_yield: number
          p_financing_amount: number
          p_financing_percentage: number
          p_financing_required: Database["public"]["Enums"]["financing_requirement"]
          p_other_preferences: string
          p_phone_1: string
          p_phone_2: string
          p_preferred_floor: string
          p_preferred_locations: string[]
          p_property_condition: Database["public"]["Enums"]["property_condition"]
          p_property_types: Database["public"]["Enums"]["property_type"][]
          p_purchase_purpose: Database["public"]["Enums"]["purchase_purpose"]
          p_purchase_timeline: Database["public"]["Enums"]["purchase_timeline"]
          p_rooms_max: number
          p_rooms_min: number
          p_size_max: number
          p_size_min: number
          p_wants_accessibility: boolean
          p_wants_balcony: boolean
          p_wants_elevator: boolean
          p_wants_parking: boolean
          p_wants_public_transport_proximity: boolean
          p_wants_storage: boolean
        }
        Returns: string
      }
      create_accounting_year: {
        Args: { p_property_id: string; p_year: number }
        Returns: {
          created_at: string
          expense_1: number
          expense_1_description: string | null
          expense_2: number
          expense_2_description: string | null
          expense_3: number
          expense_3_description: string | null
          expense_4: number
          expense_4_description: string | null
          expense_5: number
          expense_5_description: string | null
          id: string
          month: number
          notes: string | null
          profit: number | null
          property_id: string
          rent_received: number
          total_expenses: number | null
          updated_at: string
          year: number
        }[]
        SetofOptions: {
          from: "*"
          to: "property_accounting"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      customer_status: "lead" | "active" | "inactive"
      financing_requirement: "yes" | "no" | "not_sure"
      property_condition:
        | "new_from_developer"
        | "under_construction"
        | "second_hand"
        | "no_preference"
      property_status: "under_construction" | "rented" | "vacant" | "sold"
      property_type:
        | "apartment"
        | "private_house"
        | "penthouse"
        | "garden_apartment"
        | "commercial"
        | "office"
        | "land"
        | "other"
      purchase_purpose:
        | "investment"
        | "personal_residence"
        | "investment_with_future_residence"
        | "other"
      purchase_timeline:
        | "immediately"
        | "within_3_months"
        | "within_6_months"
        | "within_1_year"
        | "more_than_1_year"
        | "exploring"
      user_role: "admin" | "client"
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
      customer_status: ["lead", "active", "inactive"],
      financing_requirement: ["yes", "no", "not_sure"],
      property_condition: [
        "new_from_developer",
        "under_construction",
        "second_hand",
        "no_preference",
      ],
      property_status: ["under_construction", "rented", "vacant", "sold"],
      property_type: [
        "apartment",
        "private_house",
        "penthouse",
        "garden_apartment",
        "commercial",
        "office",
        "land",
        "other",
      ],
      purchase_purpose: [
        "investment",
        "personal_residence",
        "investment_with_future_residence",
        "other",
      ],
      purchase_timeline: [
        "immediately",
        "within_3_months",
        "within_6_months",
        "within_1_year",
        "more_than_1_year",
        "exploring",
      ],
      user_role: ["admin", "client"],
    },
  },
} as const
