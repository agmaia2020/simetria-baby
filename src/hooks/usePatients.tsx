
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserFilter } from '@/hooks/useUserFilter';
import { useAuth } from '@/hooks/useAuth';

export interface Patient {
  id_paciente: number;
  nome: string;
  data_nascimento: string;
  sexo: string;
  raca: string;
  data_cadastro: string;
  ativo?: boolean;
  data_exclusao?: string;
}

export const usePatients = () => {
  const [loading, setLoading] = useState(false);
  const { applyUserFilter, isAdmin, currentUserId } = useUserFilter();
  const { user } = useAuth();

  const getPatients = async (): Promise<Patient[]> => {
    try {
      setLoading(true);
      console.log("Buscando pacientes ativos...", { isAdmin, currentUserId });
      
      // Aguardar se currentUserId ainda não estiver disponível
      if (!currentUserId) {
        console.warn('currentUserId não está disponível ainda');
        return [];
      }
      
      let query = supabase
        .from('dpacientes')
        .select('*')
        .eq('ativo', true)
        .order('data_cadastro', { ascending: false });
      
      // Aplicar filtro de usuário (admin vê todos, usuário comum apenas os seus)
      query = applyUserFilter(query, currentUserId);

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar pacientes:", error);
        throw error;
      }

      console.log("Pacientes encontrados:", data?.length || 0, { isAdmin });
      return data || [];
    } catch (error) {
      console.error("Erro na busca de pacientes:", error);
      toast.error("Erro ao carregar pacientes");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getPatientById = async (id: number): Promise<Patient | null> => {
    try {
      console.log("Buscando paciente por ID:", id, { isAdmin, currentUserId });
      
      const { data, error } = await supabase
        .from('dpacientes')
        .select('*')
        .eq('id_paciente', id)
        .eq('ativo', true)
        .single();

      if (error) {
        console.error("Erro ao buscar paciente:", error);
        if (error.code === 'PGRST116') {
          console.log("Paciente não encontrado ou inativo");
          return null;
        }
        throw error;
      }

      // Verificar permissões: admin pode ver qualquer paciente, usuário comum apenas os seus
      if (!isAdmin && data.usuario_id !== currentUserId) {
        console.error("Usuário sem permissão para ver este paciente");
        toast.error("Sem permissão para acessar este paciente");
        return null;
      }

      console.log("Paciente encontrado:", data);
      return data;
    } catch (error) {
      console.error("Erro na busca do paciente:", error);
      return null;
    }
  };

  const createPatient = async (patientData: Omit<Patient, 'id_paciente' | 'data_cadastro' | 'ativo'>): Promise<Patient | null> => {
    try {
      setLoading(true);
      console.log("Criando novo paciente:", patientData, { currentUserId });
      
      if (!currentUserId) {
        toast.error("Erro: usuário não identificado");
        return null;
      }
      
      const { data, error } = await supabase
        .from('dpacientes')
        .insert({
          ...patientData,
          ativo: true,
          usuario_id: currentUserId // Associar paciente ao usuário logado
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar paciente:", error);
        throw error;
      }

      console.log("Paciente criado com sucesso:", data);
      return data;
    } catch (error) {
      console.error("Erro na criação do paciente:", error);
      toast.error("Erro ao cadastrar paciente");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePatient = async (id: number, patientData: Partial<Patient>): Promise<boolean> => {
    try {
      setLoading(true);
      console.log("Atualizando paciente:", id, patientData, { isAdmin, currentUserId });
      
      // Verificar permissões se não for admin
      if (!isAdmin) {
        const { data: patientCheck, error: checkError } = await supabase
          .from('dpacientes')
          .select('usuario_id')
          .eq('id_paciente', id)
          .single();

        if (checkError || patientCheck?.usuario_id !== currentUserId) {
          console.error("Usuário sem permissão para atualizar este paciente");
          toast.error("Sem permissão para atualizar este paciente");
          return false;
        }
      }
      
      const { error } = await supabase
        .from('dpacientes')
        .update(patientData)
        .eq('id_paciente', id);

      if (error) {
        console.error("Erro ao atualizar paciente:", error);
        throw error;
      }

      console.log("Paciente atualizado com sucesso");
      return true;
    } catch (error) {
      console.error("Erro na atualização do paciente:", error);
      toast.error("Erro ao atualizar paciente");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deletePatient = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      console.log("Excluindo paciente:", id, { isAdmin, currentUserId });
      
      // Verificar permissões se não for admin
      if (!isAdmin) {
        const { data: patientCheck, error: checkError } = await supabase
          .from('dpacientes')
          .select('usuario_id')
          .eq('id_paciente', id)
          .single();

        if (checkError || patientCheck?.usuario_id !== currentUserId) {
          console.error("Usuário sem permissão para excluir este paciente");
          toast.error("Sem permissão para excluir este paciente");
          return false;
        }
      }
      
      const { error } = await supabase
        .from('dpacientes')
        .update({ 
          ativo: false, 
          data_exclusao: new Date().toISOString() 
        })
        .eq('id_paciente', id);

      if (error) {
        console.error("Erro ao excluir paciente:", error);
        throw error;
      }

      console.log("Paciente excluído com sucesso");
      return true;
    } catch (error) {
      console.error("Erro na exclusão do paciente:", error);
      toast.error("Erro ao excluir paciente");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient
  };
};
