
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Measurement {
  id_medida?: number;
  id_paciente: number;
  data_medicao: string;
  pc?: number;
  ap?: number;
  bp?: number;
  pd?: number;
  pe?: number;
  ci?: number;
  cvai?: number;
  te?: number;
  td?: number;
  tbc?: number;
}

export const useMeasurements = () => {
  const [loading, setLoading] = useState(false);

  const getMeasurementsByPatientId = async (patientId: number): Promise<Measurement[]> => {
    try {
      setLoading(true);
      console.log("Buscando medidas para paciente:", patientId);
      
      const { data, error } = await supabase
        .from('fmedidas')
        .select('*')
        .eq('id_paciente', patientId)
        .order('data_medicao', { ascending: false });

      if (error) {
        console.error("Erro ao buscar medidas:", error);
        throw error;
      }

      console.log("Medidas encontradas:", data?.length || 0);
      return data || [];
    } catch (error) {
      console.error("Erro na busca de medidas:", error);
      toast.error("Erro ao carregar medidas");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createMeasurement = async (measurementData: Omit<Measurement, 'id_medida'>): Promise<Measurement | null> => {
    try {
      setLoading(true);
      console.log("Criando nova medida:", measurementData);
      
      const { data, error } = await supabase
        .from('fmedidas')
        .insert(measurementData)
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar medida:", error);
        throw error;
      }

      console.log("Medida criada com sucesso:", data);
      return data;
    } catch (error) {
      console.error("Erro na criação da medida:", error);
      toast.error("Erro ao cadastrar medida");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateMeasurement = async (id: number, measurementData: Partial<Measurement>): Promise<boolean> => {
    try {
      setLoading(true);
      console.log("Atualizando medida:", id, measurementData);
      
      const { error } = await supabase
        .from('fmedidas')
        .update(measurementData)
        .eq('id_medida', id);

      if (error) {
        console.error("Erro ao atualizar medida:", error);
        throw error;
      }

      console.log("Medida atualizada com sucesso");
      return true;
    } catch (error) {
      console.error("Erro na atualização da medida:", error);
      toast.error("Erro ao atualizar medida");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteMeasurement = async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      console.log("Excluindo medida:", id);
      
      const { error } = await supabase
        .from('fmedidas')
        .delete()
        .eq('id_medida', id);

      if (error) {
        console.error("Erro ao excluir medida:", error);
        throw error;
      }

      console.log("Medida excluída com sucesso");
      return true;
    } catch (error) {
      console.error("Erro na exclusão da medida:", error);
      toast.error("Erro ao excluir medida");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getMeasurementsByPatientId,
    createMeasurement,
    updateMeasurement,
    deleteMeasurement
  };
};
