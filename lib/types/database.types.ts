export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addons: {
        Row: {
          category: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          zoho_item_id: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          zoho_item_id: string
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          zoho_item_id?: string
        }
        Relationships: []
      }
      booking_addons: {
        Row: {
          addon_id: string
          booking_id: string
          id: string
          quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          addon_id: string
          booking_id: string
          id?: string
          quantity?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          addon_id?: string
          booking_id?: string
          id?: string
          quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_addons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          addons_amount: number | null
          agent_name: string | null
          base_amount: number
          booking_date: string
          booking_number: string
          booking_type: Database["public"]["Enums"]["booking_type"]
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          discount_percent: number | null
          discount_reason: string | null
          end_time: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          guest_profile_id: string | null
          id: string
          notes: string | null
          payment_reference: string | null
          pricing_id: string
          refund_amount: number | null
          space_id: string
          start_time: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          time_slot: Database["public"]["Enums"]["time_slot"]
          total_amount: number
          updated_at: string | null
          user_id: string | null
          zoho_invoice_id: string | null
          zoho_invoice_number: string | null
        }
        Insert: {
          addons_amount?: number | null
          agent_name?: string | null
          base_amount: number
          booking_date: string
          booking_number: string
          booking_type?: Database["public"]["Enums"]["booking_type"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          discount_reason?: string | null
          end_time?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guest_profile_id?: string | null
          id?: string
          notes?: string | null
          payment_reference?: string | null
          pricing_id: string
          refund_amount?: number | null
          space_id: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          time_slot: Database["public"]["Enums"]["time_slot"]
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
          zoho_invoice_id?: string | null
          zoho_invoice_number?: string | null
        }
        Update: {
          addons_amount?: number | null
          agent_name?: string | null
          base_amount?: number
          booking_date?: string
          booking_number?: string
          booking_type?: Database["public"]["Enums"]["booking_type"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          discount_reason?: string | null
          end_time?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guest_profile_id?: string | null
          id?: string
          notes?: string | null
          payment_reference?: string | null
          pricing_id?: string
          refund_amount?: number | null
          space_id?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          time_slot?: Database["public"]["Enums"]["time_slot"]
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
          zoho_invoice_id?: string | null
          zoho_invoice_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_guest_profile_id_fkey"
            columns: ["guest_profile_id"]
            isOneToOne: false
            referencedRelation: "guest_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pricing_id_fkey"
            columns: ["pricing_id"]
            isOneToOne: false
            referencedRelation: "pricing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_profiles: {
        Row: {
          converted_at: string | null
          converted_to_user_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_booking_date: string | null
          phone: string | null
          total_bookings: number | null
          updated_at: string | null
        }
        Insert: {
          converted_at?: string | null
          converted_to_user_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          last_booking_date?: string | null
          phone?: string | null
          total_bookings?: number | null
          updated_at?: string | null
        }
        Update: {
          converted_at?: string | null
          converted_to_user_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_booking_date?: string | null
          phone?: string | null
          total_bookings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_profiles_converted_to_user_id_fkey"
            columns: ["converted_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          currency: string | null
          gateway_response: Json | null
          gateway_transaction_id: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string | null
          qr_confirmation_note: string | null
          qr_confirmed_by: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          currency?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          qr_confirmation_note?: string | null
          qr_confirmed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          currency?: string | null
          gateway_response?: Json | null
          gateway_transaction_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          qr_confirmation_note?: string | null
          qr_confirmed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_qr_confirmed_by_fkey"
            columns: ["qr_confirmed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing: {
        Row: {
          created_at: string | null
          description: string | null
          duration: string
          id: string
          includes_data_gb: number | null
          is_active: boolean | null
          price: number
          slot_type: string | null
          space_id: string | null
          zoho_item_id: string
          zoho_item_name: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration: string
          id?: string
          includes_data_gb?: number | null
          is_active?: boolean | null
          price: number
          slot_type?: string | null
          space_id?: string | null
          zoho_item_id: string
          zoho_item_name?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration?: string
          id?: string
          includes_data_gb?: number | null
          is_active?: boolean | null
          price?: number
          slot_type?: string | null
          space_id?: string | null
          zoho_item_id?: string
          zoho_item_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          amenities: Json | null
          capacity: number
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          requires_specific_seat: boolean | null
          total_inventory: number
          type: string
          updated_at: string | null
        }
        Insert: {
          amenities?: Json | null
          capacity?: number
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          requires_specific_seat?: boolean | null
          total_inventory?: number
          type: string
          updated_at?: string | null
        }
        Update: {
          amenities?: Json | null
          capacity?: number
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          requires_specific_seat?: boolean | null
          total_inventory?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_member: boolean | null
          last_booking_date: string | null
          member_since: string | null
          phone: string | null
          role: string | null
          total_bookings: number | null
          total_spent: number | null
          updated_at: string | null
          zoho_contact_id: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_member?: boolean | null
          last_booking_date?: string | null
          member_since?: string | null
          phone?: string | null
          role?: string | null
          total_bookings?: number | null
          total_spent?: number | null
          updated_at?: string | null
          zoho_contact_id?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_member?: boolean | null
          last_booking_date?: string | null
          member_since?: string | null
          phone?: string | null
          role?: string | null
          total_bookings?: number | null
          total_spent?: number | null
          updated_at?: string | null
          zoho_contact_id?: string | null
        }
        Relationships: []
      }
      zoho_item_mapping: {
        Row: {
          category: string | null
          created_at: string | null
          duration: string | null
          id: string
          last_synced_at: string | null
          local_entity_id: string | null
          local_entity_type: string | null
          sync_hash: string | null
          updated_at: string | null
          zoho_description: string | null
          zoho_item_id: string
          zoho_item_name: string
          zoho_item_type: string | null
          zoho_rate: number | null
          zoho_status: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          last_synced_at?: string | null
          local_entity_id?: string | null
          local_entity_type?: string | null
          sync_hash?: string | null
          updated_at?: string | null
          zoho_description?: string | null
          zoho_item_id: string
          zoho_item_name: string
          zoho_item_type?: string | null
          zoho_rate?: number | null
          zoho_status?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          last_synced_at?: string | null
          local_entity_id?: string | null
          local_entity_type?: string | null
          sync_hash?: string | null
          updated_at?: string | null
          zoho_description?: string | null
          zoho_item_id?: string
          zoho_item_name?: string
          zoho_item_type?: string | null
          zoho_rate?: number | null
          zoho_status?: string | null
        }
        Relationships: []
      }
      zoho_sync_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          items_created: number | null
          items_deactivated: number | null
          items_synced: number | null
          items_updated: number | null
          started_at: string
          status: string
          sync_type: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          items_created?: number | null
          items_deactivated?: number | null
          items_synced?: number | null
          items_updated?: number | null
          started_at?: string
          status: string
          sync_type: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          items_created?: number | null
          items_deactivated?: number | null
          items_synced?: number | null
          items_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_availability: {
        Args: {
          p_date: string
          p_slot: Database["public"]["Enums"]["time_slot"]
          p_space_id: string
        }
        Returns: {
          booked_count: number
          is_available: boolean
          total_inventory: number
        }[]
      }
      check_member_discount: {
        Args: { p_user_id: string }
        Returns: {
          days_since_last_booking: number
          discount_percent: number
          eligible: boolean
          last_booking: string
        }[]
      }
      convert_guest_to_member: {
        Args: { p_guest_email: string; p_password?: string }
        Returns: string
      }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "checked_in"
        | "completed"
        | "cancelled"
        | "no_show"
        | "expired"
      booking_type: "member" | "guest"
      payment_method: "payhere" | "qr_transfer" | "cash" | "card_terminal" | "stripe"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
        | "partially_refunded"
      time_slot:
        | "morning"
        | "afternoon"
        | "evening"
        | "night"
        | "full_day"
        | "unlimited"
        | "1hr"
        | "2hr"
        | "30min"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: [
        "pending_payment",
        "confirmed",
        "checked_in",
        "completed",
        "cancelled",
        "no_show",
        "expired",
      ],
      booking_type: ["member", "guest"],
      payment_method: ["payhere", "qr_transfer", "cash", "card_terminal", "stripe"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      time_slot: [
        "morning",
        "afternoon",
        "evening",
        "night",
        "full_day",
        "unlimited",
        "1hr",
        "2hr",
        "30min",
      ],
    },
  },
} as const

