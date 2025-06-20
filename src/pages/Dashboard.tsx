
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Users, UserCheck, Calendar, TrendingUp } from "lucide-react";
import Layout from "@/components/Layout";
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

const Dashboard = () => {
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

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  const chartConfig = {
    count: {
      label: "Quantidade",
      color: "hsl(var(--chart-1))",
    },
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Carregando dados...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard" showBackButton={false}>
      <div className="space-y-6">
        {/* Cards de estatísticas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">Pacientes ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Idade Média</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.averageAge} anos</div>
              <p className="text-xs text-muted-foreground">Média geral</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Medidas</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.patientsWithMeasurements}</div>
              <p className="text-xs text-muted-foreground">Pacientes com medições</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos (30 dias)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.recentRegistrations}</div>
              <p className="text-xs text-muted-foreground">Registros recentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Cards de distribuição por sexo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.malePatients}</div>
              <div className="text-sm text-gray-600">Pacientes Masculinos</div>
              <div className="text-xs text-muted-foreground">
                {stats.totalPatients > 0 ? Math.round((stats.malePatients / stats.totalPatients) * 100) : 0}% do total
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-pink-600">{stats.femalePatients}</div>
              <div className="text-sm text-gray-600">Pacientes Femininos</div>
              <div className="text-xs text-muted-foreground">
                {stats.totalPatients > 0 ? Math.round((stats.femalePatients / stats.totalPatients) * 100) : 0}% do total
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de distribuição por raça/cor - cor azul */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Raça/Cor</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={raceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="raca" 
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Gráfico de distribuição por idade - barras horizontais verdes ordenadas */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Faixa Etária</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageGroups} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="grupo" 
                      fontSize={12}
                      width={80}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
