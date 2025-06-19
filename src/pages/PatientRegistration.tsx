
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

const PatientRegistration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  const loadPatientData = async (patientId: number) => {
    try {
      console.log("Carregando dados do paciente:", patientId);
      
      const { data, error } = await supabase
        .from('dpacientes')
        .select('*')
        .eq('id_paciente', patientId)
        .single();

      if (error) {
        console.error("Erro ao carregar paciente:", error);
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
      console.error("Erro inesperado:", error);
      toast.error("Erro inesperado ao carregar paciente");
      navigate("/lista-pacientes");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!formData.data_nascimento) {
      toast.error("Data de nascimento é obrigatória");
      return;
    }
    if (!formData.sexo) {
      toast.error("Sexo é obrigatório");
      return;
    }
    if (!formData.raca) {
      toast.error("Raça/Cor é obrigatória");
      return;
    }

    setIsLoading(true);
    
    try {
      if (isEditing && editId) {
        // Atualizar paciente existente
        const { error } = await supabase
          .from('dpacientes')
          .update({
            nome: formData.nome.trim(),
            data_nascimento: formData.data_nascimento,
            sexo: formData.sexo,
            raca: formData.raca
          })
          .eq('id_paciente', parseInt(editId));

        if (error) {
          console.error("Erro ao atualizar paciente:", error);
          toast.error("Erro ao atualizar paciente");
          return;
        }

        toast.success("Paciente atualizado com sucesso!");
        navigate("/lista-pacientes");
      } else {
        // Criar novo paciente
        const { data, error } = await supabase
          .from('dpacientes')
          .insert({
            nome: formData.nome.trim(),
            data_nascimento: formData.data_nascimento,
            sexo: formData.sexo,
            raca: formData.raca,
            ativo: true
          })
          .select()
          .single();

        if (error) {
          console.error("Erro ao cadastrar paciente:", error);
          toast.error("Erro ao cadastrar paciente");
          return;
        }

        console.log("Paciente cadastrado:", data);
        toast.success("Paciente cadastrado com sucesso!");
        
        // Redirecionar para cadastro de medidas com o ID do novo paciente
        if (data && data.id_paciente) {
          navigate(`/cadastro-medidas?paciente_id=${data.id_paciente}`);
        } else {
          navigate("/lista-pacientes");
        }
      }
      
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Erro inesperado ao salvar paciente");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      data_nascimento: "",
      sexo: "",
      raca: ""
    });
    toast.info("Formulário limpo");
  };

  return (
    <Layout title={isEditing ? "Editar Paciente" : "Cadastro de Paciente"}>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isEditing ? "Editar Dados do Paciente" : "Dados do Paciente"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Primeira linha: Nome e Data de Nascimento */}
              <div className="grid md:grid-cols-2 gap-4">
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

              {/* Segunda linha: Sexo e Raça */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sexo *</Label>
                  <Select 
                    value={formData.sexo} 
                    onValueChange={(value) => handleInputChange("sexo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Raça/Cor *</Label>
                  <Select 
                    value={formData.raca} 
                    onValueChange={(value) => handleInputChange("raca", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a raça/cor" />
                    </SelectTrigger>
                    <SelectContent>
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

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? "Salvando..." : isEditing ? "Atualizar Paciente" : "Cadastrar Paciente"}
                </Button>
                {!isEditing && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1"
                  >
                    Limpar Formulário
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/lista-pacientes")}
                  className="flex-1"
                >
                  {isEditing ? "Cancelar" : "Lista de Pacientes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientRegistration;
