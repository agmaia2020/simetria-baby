
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Layout from "@/components/Layout";

const PatientRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: "",
    dataNascimento: "",
    sexo: "",
    raca: ""
  });
  const [isLoading, setIsLoading] = useState(false);

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
    if (!formData.dataNascimento) {
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
      // Simular cadastro (aqui você integraria com Supabase)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Paciente cadastrado com sucesso!");
      
      // Redirecionar para cadastro de medidas
      setTimeout(() => {
        navigate("/cadastro-medidas?paciente_id=1");
      }, 1000);
      
    } catch (error) {
      toast.error("Erro ao cadastrar paciente");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      dataNascimento: "",
      sexo: "",
      raca: ""
    });
    toast.info("Formulário limpo");
  };

  return (
    <Layout title="Cadastro de Paciente">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Dados do Paciente</CardTitle>
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
                  <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => handleInputChange("dataNascimento", e.target.value)}
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
                  {isLoading ? "Cadastrando..." : "Cadastrar Paciente"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                >
                  Limpar Formulário
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
