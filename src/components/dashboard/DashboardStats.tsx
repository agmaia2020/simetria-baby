import { Users, UserCheck, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
interface DashboardStatsProps {
  stats: {
    totalPatients: number;
    malePatients: number;
    femalePatients: number;
    averageAge: number;
    patientsWithMeasurements: number;
    recentRegistrations: number;
  };
}
export const DashboardStats = ({
  stats
}: DashboardStatsProps) => {
  return <div className="space-y-6">
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
            <div className="text-2xl font-bold text-blue-600">{stats.averageAge} anos</div>
            <p className="text-xs text-muted-foreground">Média geral</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Medidas</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.patientsWithMeasurements}</div>
            <p className="text-xs text-muted-foreground">Pacientes com medições</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos (30 dias)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.recentRegistrations}</div>
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
              {stats.totalPatients > 0 ? Math.round(stats.malePatients / stats.totalPatients * 100) : 0}% do total
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.femalePatients}</div>
            <div className="text-sm text-gray-600">Pacientes Femininos</div>
            <div className="text-xs text-muted-foreground">
              {stats.totalPatients > 0 ? Math.round(stats.femalePatients / stats.totalPatients * 100) : 0}% do total
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};