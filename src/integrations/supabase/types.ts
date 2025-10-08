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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      dpacientes: {
        Row: {
          ativo: boolean | null
          data_cadastro: string | null
          data_exclusao: string | null
          data_nascimento: string
          id_paciente: number
          nome: string
          raca: string
          sexo: string
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          data_cadastro?: string | null
          data_exclusao?: string | null
          data_nascimento: string
          id_paciente?: number
          nome: string
          raca: string
          sexo: string
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          data_cadastro?: string | null
          data_exclusao?: string | null
          data_nascimento?: string
          id_paciente?: number
          nome?: string
          raca?: string
          sexo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dpacientes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      fmedidas: {
        Row: {
          ap: number | null
          bp: number | null
          ci: number | null
          cvai: number | null
          data_medicao: string | null
          id_medida: number
          id_paciente: number
          pc: number | null
          pd: number | null
          pe: number | null
          tbc: number | null
          td: number | null
          te: number | null
          usuario_id: string | null
        }
        Insert: {
          ap?: number | null
          bp?: number | null
          ci?: number | null
          cvai?: number | null
          data_medicao?: string | null
          id_medida?: number
          id_paciente: number
          pc?: number | null
          pd?: number | null
          pe?: number | null
          tbc?: number | null
          td?: number | null
          te?: number | null
          usuario_id?: string | null
        }
        Update: {
          ap?: number | null
          bp?: number | null
          ci?: number | null
          cvai?: number | null
          data_medicao?: string | null
          id_medida?: number
          id_paciente?: number
          pc?: number | null
          pd?: number | null
          pe?: number | null
          tbc?: number | null
          td?: number | null
          te?: number | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fmedidas_id_paciente_fkey"
            columns: ["id_paciente"]
            isOneToOne: false
            referencedRelation: "dpacientes"
            referencedColumns: ["id_paciente"]
          },
          {
            foreignKeyName: "fmedidas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_pacientes: {
        Row: {
          dados_anteriores: Json | null
          dados_novos: Json | null
          data_alteracao: string
          id: number
          id_paciente: number
          usuario_alteracao: string | null
          usuario_id: string | null
        }
        Insert: {
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_alteracao?: string
          id?: number
          id_paciente: number
          usuario_alteracao?: string | null
          usuario_id?: string | null
        }
        Update: {
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_alteracao?: string
          id?: number
          id_paciente?: number
          usuario_alteracao?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_pacientes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean
          created_at: string
          email: string
          id: string
          is_admin: boolean | null
          nome: string
          senha_hash: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email: string
          id?: string
          is_admin?: boolean | null
          nome: string
          senha_hash: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean | null
          nome?: string
          senha_hash?: string
          updated_at?: string
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
