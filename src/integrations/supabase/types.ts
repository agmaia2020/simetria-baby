export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        }
        Relationships: []
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
        }
        Relationships: [
          {
            foreignKeyName: "fmedidas_id_paciente_fkey"
            columns: ["id_paciente"]
            isOneToOne: false
            referencedRelation: "dpacientes"
            referencedColumns: ["id_paciente"]
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
        }
        Insert: {
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_alteracao?: string
          id?: number
          id_paciente: number
          usuario_alteracao?: string | null
        }
        Update: {
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          data_alteracao?: string
          id?: number
          id_paciente?: number
          usuario_alteracao?: string | null
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
