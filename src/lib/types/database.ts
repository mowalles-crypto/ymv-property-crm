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
      acquisition_cost_rules: {
        Row: {
          active: boolean
          calculation_type: Database["public"]["Enums"]["cost_calculation_type"]
          conditions: string | null
          cost_type: Database["public"]["Enums"]["acquisition_cost_type"]
          created_at: string
          effective_from: string
          effective_to: string | null
          fixed_amount: number | null
          id: string
          maximum_amount: number | null
          minimum_amount: number | null
          notes: string | null
          percentage_rate: number | null
          source: string | null
          tiers: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          calculation_type: Database["public"]["Enums"]["cost_calculation_type"]
          conditions?: string | null
          cost_type: Database["public"]["Enums"]["acquisition_cost_type"]
          created_at?: string
          effective_from: string
          effective_to?: string | null
          fixed_amount?: number | null
          id?: string
          maximum_amount?: number | null
          minimum_amount?: number | null
          notes?: string | null
          percentage_rate?: number | null
          source?: string | null
          tiers?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          calculation_type?: Database["public"]["Enums"]["cost_calculation_type"]
          conditions?: string | null
          cost_type?: Database["public"]["Enums"]["acquisition_cost_type"]
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          fixed_amount?: number | null
          id?: string
          maximum_amount?: number | null
          minimum_amount?: number | null
          notes?: string | null
          percentage_rate?: number | null
          source?: string | null
          tiers?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      capital_gains_tax_estimates: {
        Row: {
          calculated_at: string
          calculated_cost_basis: number
          calculation_details: Json
          created_at: string
          customer_id: string
          disclaimer_acknowledged: boolean
          estimated_gain: number
          estimated_sale_price: number
          estimated_tax: number
          id: string
          property_id: string
          rule_version: string
          sale_request_id: string | null
        }
        Insert: {
          calculated_at?: string
          calculated_cost_basis: number
          calculation_details?: Json
          created_at?: string
          customer_id: string
          disclaimer_acknowledged?: boolean
          estimated_gain: number
          estimated_sale_price: number
          estimated_tax: number
          id?: string
          property_id: string
          rule_version: string
          sale_request_id?: string | null
        }
        Update: {
          calculated_at?: string
          calculated_cost_basis?: number
          calculation_details?: Json
          created_at?: string
          customer_id?: string
          disclaimer_acknowledged?: boolean
          estimated_gain?: number
          estimated_sale_price?: number
          estimated_tax?: number
          id?: string
          property_id?: string
          rule_version?: string
          sale_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capital_gains_tax_estimates_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_gains_tax_estimates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capital_gains_tax_estimates_sale_request_id_fkey"
            columns: ["sale_request_id"]
            isOneToOne: false
            referencedRelation: "property_sale_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      capital_gains_tax_rules: {
        Row: {
          active: boolean
          calculation_notes: string | null
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          parameters: Json
          rule_version: string
          source: string | null
          tax_rate: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          calculation_notes?: string | null
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          parameters?: Json
          rule_version: string
          source?: string | null
          tax_rate: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          calculation_notes?: string | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          parameters?: Json
          rule_version?: string
          source?: string | null
          tax_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_bank_accounts: {
        Row: {
          account_holder_identifier: string | null
          account_holder_name: string
          account_number: string
          bank_name: string
          bank_number: string
          branch_name: string | null
          branch_number: string
          created_at: string
          customer_id: string
          iban: string | null
          id: string
          notes: string | null
          swift_bic: string | null
          updated_at: string
        }
        Insert: {
          account_holder_identifier?: string | null
          account_holder_name: string
          account_number: string
          bank_name: string
          bank_number: string
          branch_name?: string | null
          branch_number: string
          created_at?: string
          customer_id: string
          iban?: string | null
          id?: string
          notes?: string | null
          swift_bic?: string | null
          updated_at?: string
        }
        Update: {
          account_holder_identifier?: string | null
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          bank_number?: string
          branch_name?: string | null
          branch_number?: string
          created_at?: string
          customer_id?: string
          iban?: string | null
          id?: string
          notes?: string | null
          swift_bic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_bank_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_documents: {
        Row: {
          created_at: string
          customer_id: string
          document_date: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          expiry_date: string | null
          file_size: number
          id: string
          mime_type: string
          notes: string | null
          original_filename: string
          passport_country: string | null
          passport_number: string | null
          spouse_id: string | null
          storage_path: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          document_date?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          expiry_date?: string | null
          file_size: number
          id?: string
          mime_type: string
          notes?: string | null
          original_filename: string
          passport_country?: string | null
          passport_number?: string | null
          spouse_id?: string | null
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          document_date?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          expiry_date?: string | null
          file_size?: number
          id?: string
          mime_type?: string
          notes?: string | null
          original_filename?: string
          passport_country?: string | null
          passport_number?: string | null
          spouse_id?: string | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_documents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_documents_spouse_id_fkey"
            columns: ["spouse_id"]
            isOneToOne: false
            referencedRelation: "customer_spouses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_spouses: {
        Row: {
          created_at: string
          customer_id: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          passport_country: string | null
          passport_expiry_date: string | null
          passport_issue_date: string | null
          passport_number: string | null
          phone_1: string | null
          phone_2: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          passport_country?: string | null
          passport_expiry_date?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          phone_1?: string | null
          phone_2?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          passport_country?: string | null
          passport_expiry_date?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          phone_1?: string | null
          phone_2?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_spouses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
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
      investment_inquiries: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          investment_offer_id: string
          notes: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          investment_offer_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          investment_offer_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_inquiries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_inquiries_investment_offer_id_fkey"
            columns: ["investment_offer_id"]
            isOneToOne: false
            referencedRelation: "investment_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_offer_documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: Database["public"]["Enums"]["offer_document_type"]
          file_size: number
          id: string
          investment_offer_id: string
          mime_type: string
          original_filename: string
          sort_order: number
          storage_path: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type?: Database["public"]["Enums"]["offer_document_type"]
          file_size: number
          id?: string
          investment_offer_id: string
          mime_type: string
          original_filename: string
          sort_order?: number
          storage_path: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: Database["public"]["Enums"]["offer_document_type"]
          file_size?: number
          id?: string
          investment_offer_id?: string
          mime_type?: string
          original_filename?: string
          sort_order?: number
          storage_path?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_offer_documents_investment_offer_id_fkey"
            columns: ["investment_offer_id"]
            isOneToOne: false
            referencedRelation: "investment_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_offers: {
        Row: {
          address_or_project_name: string
          city: string
          construction_status: Database["public"]["Enums"]["property_condition"]
          created_at: string
          economic_analysis: string | null
          estimated_annual_expenses: number | null
          expected_annual_income: number | null
          expected_delivery_date: string | null
          expected_gross_yield: number | null
          expected_monthly_rent: number | null
          expected_net_yield: number | null
          featured: boolean
          financing_available: boolean
          id: string
          location: string | null
          minimum_equity_required: number | null
          override_brokerage_fee_amount: number | null
          override_lawyer_fee_amount: number | null
          override_purchase_tax_amount: number | null
          property_price: number
          property_purpose: Database["public"]["Enums"]["purchase_purpose"]
          property_size: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          published_at: string | null
          rooms: number | null
          short_description: string | null
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          address_or_project_name: string
          city: string
          construction_status?: Database["public"]["Enums"]["property_condition"]
          created_at?: string
          economic_analysis?: string | null
          estimated_annual_expenses?: number | null
          expected_annual_income?: number | null
          expected_delivery_date?: string | null
          expected_gross_yield?: number | null
          expected_monthly_rent?: number | null
          expected_net_yield?: number | null
          featured?: boolean
          financing_available?: boolean
          id?: string
          location?: string | null
          minimum_equity_required?: number | null
          override_brokerage_fee_amount?: number | null
          override_lawyer_fee_amount?: number | null
          override_purchase_tax_amount?: number | null
          property_price: number
          property_purpose?: Database["public"]["Enums"]["purchase_purpose"]
          property_size?: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          published_at?: string | null
          rooms?: number | null
          short_description?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          address_or_project_name?: string
          city?: string
          construction_status?: Database["public"]["Enums"]["property_condition"]
          created_at?: string
          economic_analysis?: string | null
          estimated_annual_expenses?: number | null
          expected_annual_income?: number | null
          expected_delivery_date?: string | null
          expected_gross_yield?: number | null
          expected_monthly_rent?: number | null
          expected_net_yield?: number | null
          featured?: boolean
          financing_available?: boolean
          id?: string
          location?: string | null
          minimum_equity_required?: number | null
          override_brokerage_fee_amount?: number | null
          override_lawyer_fee_amount?: number | null
          override_purchase_tax_amount?: number | null
          property_price?: number
          property_purpose?: Database["public"]["Enums"]["purchase_purpose"]
          property_size?: number | null
          property_type?: Database["public"]["Enums"]["property_type"]
          published_at?: string | null
          rooms?: number | null
          short_description?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
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
      property_sale_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_id: string
          desired_sale_date: string | null
          id: string
          minimum_acceptable_price: number | null
          notes: string | null
          payment_terms: string | null
          property_id: string
          requested_sale_price: number
          status: Database["public"]["Enums"]["sale_request_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_id: string
          desired_sale_date?: string | null
          id?: string
          minimum_acceptable_price?: number | null
          notes?: string | null
          payment_terms?: string | null
          property_id: string
          requested_sale_price: number
          status?: Database["public"]["Enums"]["sale_request_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_id?: string
          desired_sale_date?: string | null
          id?: string
          minimum_acceptable_price?: number | null
          notes?: string | null
          payment_terms?: string | null
          property_id?: string
          requested_sale_price?: number
          status?: Database["public"]["Enums"]["sale_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_sale_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_sale_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_tax_basis: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          other_recognized_costs: number | null
          property_id: string
          purchase_brokerage_fee: number | null
          purchase_legal_fee: number | null
          purchase_tax_paid: number | null
          recognized_improvement_costs: number | null
          sale_brokerage_fee: number | null
          sale_legal_fee: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          other_recognized_costs?: number | null
          property_id: string
          purchase_brokerage_fee?: number | null
          purchase_legal_fee?: number | null
          purchase_tax_paid?: number | null
          recognized_improvement_costs?: number | null
          sale_brokerage_fee?: number | null
          sale_legal_fee?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          other_recognized_costs?: number | null
          property_id?: string
          purchase_brokerage_fee?: number | null
          purchase_legal_fee?: number | null
          purchase_tax_paid?: number | null
          recognized_improvement_costs?: number | null
          sale_brokerage_fee?: number | null
          sale_legal_fee?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_tax_basis_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_transactions: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["transaction_category"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          notes: string | null
          property_id: string
          source: string | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["transaction_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          property_id: string
          source?: string | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["transaction_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          source?: string | null
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
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
      estimate_capital_gains_tax: {
        Args: {
          p_estimated_sale_price: number
          p_property_id: string
          p_sale_request_id?: string
        }
        Returns: {
          calculated_at: string
          calculated_cost_basis: number
          calculation_details: Json
          created_at: string
          customer_id: string
          disclaimer_acknowledged: boolean
          estimated_gain: number
          estimated_sale_price: number
          estimated_tax: number
          id: string
          property_id: string
          rule_version: string
          sale_request_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "capital_gains_tax_estimates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_my_sale_requests: {
        Args: never
        Returns: {
          admin_notes: string | null
          created_at: string
          customer_id: string
          desired_sale_date: string | null
          id: string
          minimum_acceptable_price: number | null
          notes: string | null
          payment_terms: string | null
          property_id: string
          requested_sale_price: number
          status: Database["public"]["Enums"]["sale_request_status"]
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "property_sale_requests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      acquisition_cost_type: "purchase_tax" | "lawyer_fee" | "brokerage_fee"
      cost_calculation_type: "percentage" | "fixed" | "tiered" | "custom"
      customer_status: "lead" | "active" | "inactive"
      document_type:
        | "customer_passport"
        | "spouse_passport"
        | "power_of_attorney"
        | "bank_document"
        | "other"
      financing_requirement: "yes" | "no" | "not_sure"
      inquiry_status:
        | "new"
        | "contacted"
        | "in_discussion"
        | "closed_won"
        | "closed_lost"
      offer_document_type:
        | "image"
        | "floor_plan"
        | "brochure"
        | "permit"
        | "planning_approval"
        | "zoning"
        | "specification"
        | "other"
      offer_status: "draft" | "active" | "reserved" | "sold" | "archived"
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
      sale_request_status:
        | "submitted"
        | "under_review"
        | "approved_for_marketing"
        | "marketing"
        | "offer_received"
        | "sold"
        | "cancelled"
      transaction_category:
        | "rent"
        | "maintenance"
        | "repair"
        | "municipal_tax"
        | "insurance"
        | "management_fee"
        | "utilities"
        | "legal"
        | "brokerage"
        | "financing"
        | "other"
      transaction_type: "income" | "expense"
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
      acquisition_cost_type: ["purchase_tax", "lawyer_fee", "brokerage_fee"],
      cost_calculation_type: ["percentage", "fixed", "tiered", "custom"],
      customer_status: ["lead", "active", "inactive"],
      document_type: [
        "customer_passport",
        "spouse_passport",
        "power_of_attorney",
        "bank_document",
        "other",
      ],
      financing_requirement: ["yes", "no", "not_sure"],
      inquiry_status: [
        "new",
        "contacted",
        "in_discussion",
        "closed_won",
        "closed_lost",
      ],
      offer_document_type: [
        "image",
        "floor_plan",
        "brochure",
        "permit",
        "planning_approval",
        "zoning",
        "specification",
        "other",
      ],
      offer_status: ["draft", "active", "reserved", "sold", "archived"],
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
      sale_request_status: [
        "submitted",
        "under_review",
        "approved_for_marketing",
        "marketing",
        "offer_received",
        "sold",
        "cancelled",
      ],
      transaction_category: [
        "rent",
        "maintenance",
        "repair",
        "municipal_tax",
        "insurance",
        "management_fee",
        "utilities",
        "legal",
        "brokerage",
        "financing",
        "other",
      ],
      transaction_type: ["income", "expense"],
      user_role: ["admin", "client"],
    },
  },
} as const
