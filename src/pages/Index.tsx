import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, UserPlus, Ruler, List } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";

// Importação do novo logotipo.
// Certifique-se de que o caminho relativo ou o alias ('@') está correto para a estrutura do seu projeto.
import novoLogo from "@/assets/Logo Modificado.png";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();

  // A estrutura de dados para os itens do menu permanece a mesma.
  const menuItems = [
    {
      title: "Dashboard",
      description: "Visualizar estatísticas e relatórios",
      icon: BarChart,
      path: "/dashboard",
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      title: "Cadastro de Pacientes",
      description: "Registrar novos pacientes no sistema",
      icon: UserPlus,
      path: "/cadastro-paciente",
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Cadastro de Medidas",
      description: "Registrar medidas cranianas dos pacientes",
      icon: Ruler,
      path: "/cadastro-medidas",
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Lista de Pacientes",
      description: "Visualizar e gerenciar pacientes",
      icon: List,
      path: "/lista-pacientes",
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Barra de Navegação Superior (Header) com tamanhos ajustados */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Título do Sistema com maior destaque */}
            <div className="flex items-center space-x-4"> {/* Espaçamento aumentado */}
              <img
                src={novoLogo}
                alt="Logo Simetrik Baby"
                className="h-10 w-auto" // Altura do logo aumentada para 40px
              />
              <span className="text-2xl font-semibold text-gray-800"> {/* Tamanho da fonte aumentado */}
                Simetrik Baby
              </span>
            </div>
            
            {/* Ícone de Perfil do Usuário */}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* 2. Conteúdo Principal */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Cabeçalho da Página */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Painel de Controle</h1>
          <p className="mt-1 text-lg text-gray-600">
            Selecione uma das opções abaixo para começar.
          </p>
        </div>

        {/* 3. Grid de Ações (Cards) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                onClick={() => navigate(item.path)}
                className="hover:shadow-lg hover:-translate-y-1 transition-transform duration-300 cursor-pointer group"
              >
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-800">{item.title}</CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      {item.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </main>
      
      {/* 4. Rodapé */}
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

export default Index;
