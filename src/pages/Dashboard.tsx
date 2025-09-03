// Seus imports originais, que contêm a lógica principal da página
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RaceChart } from "@/components/dashboard/RaceChart";
import { AgeGroupChart } from "@/components/dashboard/AgeGroupChart";
import { useDashboardData } from "@/hooks/useDashboardData";

// Imports necessários para o novo layout e navegação
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react"; // Adicionado ícone ArrowLeft
import { UserMenu } from "@/components/auth/UserMenu";
import novoLogo from "@/assets/Logo Modificado.png";

// Importando seu hook de autenticação (caminho hipotético)
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  // --- LÓGICA DE DADOS E AUTENTICAÇÃO (100% PRESERVADA) ---
  const { stats, raceData, ageGroups, loading } = useDashboardData();
  const { user } = useAuth(); // Seu hook de autenticação para obter o usuário
  const navigate = useNavigate();

  const chartConfig = {
    count: {
      label: "Quantidade",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Header Padrão com Navegação para Home */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* ÁREA CLICÁVEL PARA VOLTAR À PÁGINA INICIAL */}
            <div
              className="flex items-center space-x-4 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <img src={novoLogo} alt="Logo Simetrik Baby" className="h-10 w-auto" />
              <span className="text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                Simetrik Baby
              </span>
            </div>
            
            {/* Exibição do nome do usuário (agora funcionando) */}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* 2. Conteúdo Principal da Página */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Cabeçalho da página com BOTÃO DE VOLTAR */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)} // Navega para a página anterior no histórico
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-lg text-gray-600">
                Análise de dados e estatísticas gerais dos pacientes.
              </p>
            </div>
          </div>
        </div>

        {/* Sua lógica de 'loading' e renderização de conteúdo, 100% preservada */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-500 text-lg">Carregando dados...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <DashboardStats stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RaceChart data={raceData} chartConfig={chartConfig} />
              <AgeGroupChart data={ageGroups} chartConfig={chartConfig} />
            </div>
          </div>
        )}
      </main>

      {/* 3. Rodapé Padrão */}
      <footer className="mt-16 pb-8 text-center text-gray-500 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
            <a href="/termos-de-servico" className="hover:text-blue-600 transition-colors">Termos de Serviço</a>
            <span className="hidden md:inline">•</span>
            <a href="/politica-de-privacidade" className="hover:text-blue-600 transition-colors">Política de Privacidade</a>
            <span className="hidden md:inline">•</span>
            <a href="mailto:suporte@simetrikbaby.com" className="hover:text-blue-600 transition-colors">Suporte</a>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-2 text-sm">
            <p>© {new Date().getFullYear()} Simetrik Baby. Todos os direitos reservados.</p>
            <span className="hidden md:inline">•</span>
            <p>Versão 1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
