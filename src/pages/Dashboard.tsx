import { BarChart, UserPlus, Ruler, List, UserCircle } from "lucide-react"; // Ícones para o header
import novoLogo from "@/assets/Logo Modificado.png"; // Logo para o header

// Seus imports originais, mantidos
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RaceChart } from "@/components/dashboard/RaceChart";
import { AgeGroupChart } from "@/components/dashboard/AgeGroupChart";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom"; // Importar para navegação

const Dashboard = () => {
  // Nenhuma alteração na sua lógica de dados.
  const { stats, raceData, ageGroups, loading } = useDashboardData();
  const navigate = useNavigate(); // Hook para navegação

  // Simulação de usuário logado para o header (substituir pela sua lógica real)
  const usuarioLogado = {
    nome: "Dr. Ana Silva",
  };

  const chartConfig = {
    count: {
      label: "Quantidade",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Header Padrão (copiado da tela inicial para consistência) */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 cursor-pointer" onClick={() => navigate('/')}>
              <img src={novoLogo} alt="Logo Simetrik Baby" className="h-10 w-auto" />
              <span className="text-2xl font-semibold text-gray-800">Simetrik Baby</span>
            </div>
            <div className="flex items-center space-x-3">
              {usuarioLogado && (
                <span className="text-base font-medium text-gray-700 hidden sm:block">
                  {usuarioLogado.nome}
                </span>
              )}
              <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <UserCircle className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Conteúdo Principal da Página */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Cabeçalho da Página de Dashboard */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-lg text-gray-600">
            Análise de dados e estatísticas gerais dos pacientes.
          </p>
        </div>

        {/* Lógica de Carregamento e Exibição do Conteúdo */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-500 text-lg">Carregando dados...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Seus componentes de dashboard permanecem aqui, sem alterações */}
            <DashboardStats stats={stats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RaceChart data={raceData} chartConfig={chartConfig} />
              <AgeGroupChart data={ageGroups} chartConfig={chartConfig} />
            </div>
          </div>
        )}
      </main>

      {/* 3. Rodapé Padrão (opcional, mas bom para consistência) */}
      <footer className="mt-16 pb-8 text-center text-gray-500">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <p className="mt-2 text-xs">&copy; {new Date().getFullYear()} Simetrik Baby. Todos os direitos reservados.</p>
          </div>
      </footer>
    </div>
  );
};

export default Dashboard;
