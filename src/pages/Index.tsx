
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Ruler, List, UserPlus, BarChart } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Dashboard",
      description: "Visualizar estatísticas e relatórios dos pacientes",
      icon: BarChart,
      path: "/dashboard",
      color: "bg-indigo-500 hover:bg-indigo-600"
    },
    {
      title: "Cadastro de Pacientes",
      description: "Registrar novos pacientes no sistema",
      icon: UserPlus,
      path: "/cadastro-paciente",
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Cadastro de Medidas",
      description: "Registrar medidas cranianas dos pacientes",
      icon: Ruler,
      path: "/lista-pacientes",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Lista de Pacientes",
      description: "Visualizar e gerenciar pacientes cadastrados",
      icon: List,
      path: "/lista-pacientes",
      color: "bg-purple-500 hover:bg-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Simetria Baby</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema de cadastro de pacientes e medições cranianas com cálculos automáticos de índices
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer h-full flex flex-col"
                onClick={() => navigate(item.path)}
              >
                <CardHeader className="text-center flex-grow">
                  <div className={`w-16 h-16 rounded-full ${item.color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(item.path);
                    }}
                  >
                    Acessar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Sobre o Sistema
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Este sistema permite o cadastro de pacientes e registro de medidas cranianas, 
              calculando automaticamente índices importantes como Índice Cefálico (CI), 
              Índice de Assimetria (CVAI) e Torção da Base do Crânio (TBC).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
