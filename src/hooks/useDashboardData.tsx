
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserFilter } from "@/hooks/useUserFilter";

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
  const { loading: userFilterLoading, currentUserId, applyUserFilter } = useUserFilter();
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

      // Aguardar carregamento das permissões de usuário
      if (userFilterLoading || !currentUserId) {
        return;
      }

      // Buscar dados básicos dos pacientes com filtro de usuário (respeitando permissões de admin)
      let patientsQuery = supabase
        .from('dpacientes')
        .select('*')
        .eq('ativo', true);
      
      // Aplicar filtro de usuário apenas se não for admin
      patientsQuery = applyUserFilter(patientsQuery, currentUserId);
      
      const { data: patients, error: patientsError } = await patientsQuery;

      if (patientsError) {
        console.error("Erro ao carregar pacientes:", patientsError);
        toast.error("Erro ao carregar dados dos pacientes");
        return;
      }

      // Verificar se o usuário possui pacientes cadastrados
      if (!patients || patients.length === 0) {
        setStats({ totalPatients: 0, malePatients: 0, femalePatients: 0, averageAge: 0, patientsWithMeasurements: 0, recentRegistrations: 0 });
        setRaceData([]);
        setAgeGroups([]);
        setLoading(false);
        return;
      }

      // Buscar medidas apenas dos pacientes do usuário logado
      const patientIds = patients.map(p => p.id_paciente);
      
      const { data: measurements, error: measurementsError } = await supabase
        .from('fmedidas')
        .select('id_paciente')
        .in('id_paciente', patientIds);

      if (measurementsError) {
        console.error("Erro ao carregar medidas:", measurementsError);
      }

      // Contar pacientes únicos que têm medidas (já filtrados pelo usuário)
      const uniquePatientsWithMeasurements = new Set(measurements?.map(m => m.id_paciente) || []).size;

      // Calcular estatísticas
      const currentDate = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const totalPatients = patients?.length || 0;
      const malePatients = patients?.filter(p => p.sexo === 'masculino').length || 0;
      const femalePatients = patients?.filter(p => p.sexo === 'feminino').length || 0;
      
      // Calcular idade média em meses - CORRIGIDO
      let averageAgeInMonths = 0;
      if (patients && patients.length > 0) {
        const totalAgeInMonths = patients.reduce((sum, patient) => {
          const birthDate = new Date(patient.data_nascimento);
          let years = currentDate.getFullYear() - birthDate.getFullYear();
          let months = currentDate.getMonth() - birthDate.getMonth();
          let days = currentDate.getDate() - birthDate.getDate();
          
          // Ajustar se o dia ainda não passou
          if (days < 0) {
            months--;
          }
          
          // Ajustar se o mês ainda não passou
          if (months < 0) {
            years--;
            months += 12;
          }
          
          const ageInMonths = years * 12 + months;
          return sum + ageInMonths;
        }, 0);
        
        averageAgeInMonths = totalAgeInMonths / patients.length;
      }

      // Registros recentes (último mês)
      const recentRegistrations = patients?.filter(p => {
        const registrationDate = new Date(p.data_cadastro);
        return registrationDate >= oneMonthAgo;
      }).length || 0;

      setStats({
        totalPatients,
        malePatients,
        femalePatients,
        averageAge: Math.round(averageAgeInMonths * 10) / 10,
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

      // Grupos por idade em meses - calculados com a idade corrigida
      const ageGroupStats = patients?.reduce((acc: Record<string, number>, patient) => {
        const birthDate = new Date(patient.data_nascimento);
        let years = currentDate.getFullYear() - birthDate.getFullYear();
        let months = currentDate.getMonth() - birthDate.getMonth();
        let days = currentDate.getDate() - birthDate.getDate();
        
        // Ajustar se o dia ainda não passou
        if (days < 0) {
          months--;
        }
        
        // Ajustar se o mês ainda não passou
        if (months < 0) {
          years--;
          months += 12;
        }
        
        const ageInMonths = years * 12 + months;

        let group = '';
        if (ageInMonths < 6) group = '0-6 meses';
        else if (ageInMonths < 12) group = '6-12 meses';
        else if (ageInMonths < 24) group = '1-2 anos';
        else if (ageInMonths < 36) group = '2-3 anos';
        else group = '3+ anos';
        
        acc[group] = (acc[group] || 0) + 1;
        return acc;
      }, {}) || {};

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
    if (!userFilterLoading && currentUserId) {
      loadDashboardData();
    }
  }, [userFilterLoading, currentUserId]);

  return {
    stats,
    raceData,
    ageGroups,
    loading: loading || userFilterLoading,
    refetch: loadDashboardData
  };
};
