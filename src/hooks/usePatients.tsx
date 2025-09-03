
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const getPatients = async (): Promise<Patient[]> => {
    try {
      setLoading(true);
      console.log("Buscando pacientes ativos...");
      
      const { data, error } = await supabase
        .from('dpacientes')
        .select('*')
        .eq('ativo', true)
        .order('data_cadastro', { ascending: false });

      if (error) {
        console.error("Erro ao buscar pacientes:", error);
        throw error;
      }

      console.log("Pacientes encontrados:", data?.length || 0);
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
      console.log("Buscando paciente por ID:", id);
      
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
      console.log("Criando novo paciente:", patientData);
      
      const { data, error } = await supabase
        .from('dpacientes')
        .insert({
          ...patientData,
          ativo: true
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
      console.log("Atualizando paciente:", id, patientData);
      
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
      console.log("Excluindo paciente:", id);
      
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
