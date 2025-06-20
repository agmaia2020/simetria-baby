
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DashboardStats {
  totalPatients: number;
  malePatients: number;
  femalePatients: number;
  averageAge: number;
  patientsWithMeasurements: number;
  recentRegistrations: number;
}

interface RaceData {
  raca: string;
  count: number;
}

interface AgeGroup {
  grupo: string;
  count: number;
}

export const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    malePatients: 0,
    femalePatients: 0,
    averageAge: 0,
    patientsWithMeasurements: 0,
    recentRegistrations: 0
  });
  const [raceData, setRaceData] = useState<RaceData[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Buscar dados básicos dos pacientes
      const { data: patients, error: patientsError } = await supabase
        .from('dpacientes')
        .select('*')
        .eq('ativo', true);

      if (patientsError) {
        console.error("Erro ao carregar pacientes:", patientsError);
        toast.error("Erro ao carregar dados dos pacientes");
        return;
      }

      // Buscar pacientes com medidas
      const { data: measurements, error: measurementsError } = await supabase
        .from('fmedidas')
        .select('id_paciente')
        .not('id_paciente', 'is', null);

      if (measurementsError) {
        console.error("Erro ao carregar medidas:", measurementsError);
      }

      const uniquePatientsWithMeasurements = new Set(measurements?.map(m => m.id_paciente) || []).size;

      // Calcular estatísticas
      const currentDate = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const totalPatients = patients?.length || 0;
      const malePatients = patients?.filter(p => p.sexo === 'masculino').length || 0;
      const femalePatients = patients?.filter(p => p.sexo === 'feminino').length || 0;
      
      // Calcular idade média
      const ages = patients?.map(p => {
        const birthDate = new Date(p.data_nascimento);
        const age = currentDate.getFullYear() - birthDate.getFullYear();
        return age;
      }) || [];
      const averageAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;

      // Registros recentes (último mês)
      const recentRegistrations = patients?.filter(p => {
        const registrationDate = new Date(p.data_cadastro);
        return registrationDate >= oneMonthAgo;
      }).length || 0;

      setStats({
        totalPatients,
        malePatients,
        femalePatients,
        averageAge: Math.round(averageAge * 10) / 10,
        patientsWithMeasurements: uniquePatientsWithMeasurements,
        recentRegistrations
      });

      // Dados por raça/cor
      const raceStats = patients?.reduce((acc: Record<string, number>, patient) => {
        acc[patient.raca] = (acc[patient.raca] || 0) + 1;
        return acc;
      }, {}) || {};

      const raceChartData = Object.entries(raceStats).map(([raca, count]) => ({
        raca: raca.charAt(0).toUpperCase() + raca.slice(1),
        count
      }));

      setRaceData(raceChartData);

      // Grupos por idade - ordenado de forma decrescente
      const ageGroupStats = ages.reduce((acc: Record<string, number>, age) => {
        let group = '';
        if (age < 1) group = '0-1 anos';
        else if (age < 2) group = '1-2 anos';
        else if (age < 3) group = '2-3 anos';
        else group = '3+ anos';
        
        acc[group] = (acc[group] || 0) + 1;
        return acc;
      }, {});

      const ageGroupChartData = Object.entries(ageGroupStats)
        .map(([grupo, count]) => ({
          grupo,
          count
        }))
        .sort((a, b) => b.count - a.count); // Ordenação decrescente

      setAgeGroups(ageGroupChartData);

    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Erro inesperado ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    stats,
    raceData,
    ageGroups,
    loading,
    refetch: loadDashboardData
  };
};
