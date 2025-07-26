import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, UserPlus, Ruler, List, UserCircle } from "lucide-react";

// O logo precisa ser importado. Certifique-se que o caminho está correto.
import logoImage from "/lovable-uploads/47f5ae1e-1be7-4cfa-a11b-981b39373714.png";
import novoLogo from "@/assets/Logo Modificado.png";

const Index = () => {
  const navigate = useNavigate();

  // A lógica e os dados permanecem os mesmos.
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
      {/* Header com ajustes de tamanho */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Título do Sistema (AJUSTADOS) */}
            <div className="flex items-center space-x-4"> {/* Aumentado de space-x-3 para space-x-4 */}
              <img 
                src={novoLogo} 
                alt="Logo Simetrik Baby" 
                className="h-10 w-auto" // Aumentado de h-8 para h-10
              />
              <span className="text-2xl font-semibold text-gray-800"> {/* Aumentado de text-xl para text-2xl */}
                Simetrik Baby
              </span>
            </div>
            
            {/* Ícone de Perfil do Usuário (permanece igual) */}
            <div className="flex items-center">
              <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <UserCircle className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* O resto do componente (main, footer) permanece o mesmo... */}
    </div>
  );
};

export default Index;
