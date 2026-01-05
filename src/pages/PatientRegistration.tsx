// Seus imports originais, 100% preservados
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Imports para o novo layout consistente
import { ArrowLeft } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import novoLogo from "@/assets/Logo Modificado.png";
import { useAuth } from "@/hooks/useAuth"; // Seu hook de autenticação

const PatientRegistration = () => {
  // --- TODA A SUA LÓGICA DE COMPONENTE PERMANECE INTACTA ---
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth(); // Obtendo o usuário logado
  const editId = searchParams.get("edit_id");
  const isEditing = !!editId;

  const [formData, setFormData] = useState({
    nome: "",
    data_nascimento: "",
    sexo: "",
    raca: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing && editId) {
      loadPatientData(parseInt(editId));
    }
  }, [isEditing, editId]);

  // As funções loadPatientData, handleInputChange, handleSubmit e resetForm
  // são exatamente as mesmas que você escreveu. Não foram alteradas.
  const loadPatientData = async (patientId: number) => {
    try {
      const { data, error } = await supabase.from('dpacientes').select('*').eq('id_paciente', patientId).single();
      if (error) {
        toast.error("Erro ao carregar dados do paciente");
        navigate("/lista-pacientes");
        return;
      }
      if (data) {
        setFormData({
          nome: data.nome || "",
          data_nascimento: data.data_nascimento || "",
          sexo: data.sexo || "",
          raca: data.raca || ""
        });
      }
    } catch (error) {
      toast.error("Erro inesperado ao carregar paciente");
      navigate("/lista-pacientes");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.data_nascimento || !formData.sexo || !formData.raca) {
      toast.error("Todos os campos marcados com * são obrigatórios.");
      return;
    }
    
    // Verificar se o usuário está logado
    if (!user || !user.id) {
      toast.error("Usuário não autenticado. Faça login novamente.");
      return;
    }
    
    setIsLoading(true);
    try {
      if (isEditing && editId) {
        const { error } = await supabase.from('dpacientes').update({ 
          ...formData, 
          nome: formData.nome.trim(),
          usuario_id: user.id 
        }).eq('id_paciente', parseInt(editId));
        if (error) throw error;
        toast.success("Paciente atualizado com sucesso!");
        navigate("/lista-pacientes");
      } else {
        const { data, error } = await supabase.from('dpacientes').insert({ 
          ...formData, 
          nome: formData.nome.trim(), 
          ativo: true,
          usuario_id: user.id 
        }).select().single();
        if (error) throw error;
        toast.success("Paciente cadastrado com sucesso!");
        if (data && data.id_paciente) {
          navigate(`/cadastro-medidas?paciente_id=${data.id_paciente}`);
        } else {
          navigate("/lista-pacientes");
        }
      }
    } catch (error: any) {
      toast.error(`Erro ao salvar paciente: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nome: "", data_nascimento: "", sexo: "", raca: "" });
    toast.info("Formulário limpo");
  };
  // --- FIM DA SUA LÓGICA DE COMPONENTE ---

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Header Padrão e Consistente */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => navigate('/home')}>
              <img src={novoLogo} alt="Logo Simetrik Baby" className="h-10 w-auto" />
              <span className="text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Simetrik Baby</span>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* 2. Conteúdo Principal da Página */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Cabeçalho da página com Título Dinâmico e Botão de Voltar */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Voltar">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{isEditing ? "Editar Paciente" : "Cadastro de Paciente"}</h1>
            <p className="mt-1 text-lg text-gray-600">Preencha os dados abaixo para {isEditing ? "atualizar o" : "registrar um novo"} paciente.</p>
          </div>
        </div>

        {/* Seu formulário, agora dentro do novo layout */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Paciente</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input 
                      id="nome" 
                      type="text" 
                      value={formData.nome} 
                      onChange={(e) => handleInputChange("nome", e.target.value)} 
                      placeholder="Digite o nome completo" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                    <Input 
                      id="data_nascimento" 
                      type="date" 
                      value={formData.data_nascimento} 
                      onChange={(e) => handleInputChange("data_nascimento", e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Select de Sexo - CORRIGIDO para mobile/Mac */}
                  <div className="space-y-2">
                    <Label>Sexo *</Label>
                    <Select 
                      value={formData.sexo} 
                      onValueChange={(value) => handleInputChange("sexo", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o sexo" />
                      </SelectTrigger>
                      <SelectContent 
                        position="popper" 
                        modal={false}
                        className="max-h-60 overflow-y-auto"
                      >
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Select de Raça/Cor - CORRIGIDO para mobile/Mac */}
                  <div className="space-y-2">
                    <Label>Raça/Cor *</Label>
                    <Select 
                      value={formData.raca} 
                      onValueChange={(value) => handleInputChange("raca", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a raça/cor" />
                      </SelectTrigger>
                      <SelectContent 
                        position="popper" 
                        modal={false}
                        className="max-h-60 overflow-y-auto"
                      >
                        <SelectItem value="branca">Branca</SelectItem>
                        <SelectItem value="preta">Preta</SelectItem>
                        <SelectItem value="parda">Parda</SelectItem>
                        <SelectItem value="amarela">Amarela</SelectItem>
                        <SelectItem value="indigena">Indígena</SelectItem>
                        <SelectItem value="oriental">Oriental</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate("/lista-pacientes")}>
                    {isEditing ? "Cancelar" : "Ver Lista"}
                  </Button>
                  {!isEditing && (
                    <Button type="button" variant="outline" onClick={resetForm}>Limpar</Button>
                  )}
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Salvando..." : isEditing ? "Atualizar Paciente" : "Salvar e Continuar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
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
            <p>© {new Date().getFullYear()} AM BI Análises Inteligentes. Todos os direitos reservados.</p>
            <span className="hidden md:inline">•</span>
            <p>Versão 1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PatientRegistration;
