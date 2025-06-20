
import Layout from "@/components/Layout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RaceChart } from "@/components/dashboard/RaceChart";
import { AgeGroupChart } from "@/components/dashboard/AgeGroupChart";
import { useDashboardData } from "@/hooks/useDashboardData";

const Dashboard = () => {
  const { stats, raceData, ageGroups, loading } = useDashboardData();

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
        <DashboardStats stats={stats} />
        
        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RaceChart data={raceData} chartConfig={chartConfig} />
          <AgeGroupChart data={ageGroups} chartConfig={chartConfig} />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
