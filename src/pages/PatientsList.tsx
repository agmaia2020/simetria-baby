
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Edit, Trash2, Plus, Ruler, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

interface Patient {
  id_paciente: number;
  nome: string;
  data_nascimento: string;
  sexo: string;
  raca: string;
  data_cadastro: string;
  ativo?: boolean;
}

const PatientsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 10;

  // Verificar se foi chamada com um ID específico de paciente
  const specificPatientId = searchParams.get('paciente_id');

  useEffect(() => {
    loadPatients();
  }, [specificPatientId]);

  const loadPatients = async () => {
    try {
      console.log("Carregando pacientes...");
      setLoading(true);
      
      let query = supabase
        .from('dpacientes')
        .select('*')
        .eq('ativo', true);

      // Se foi especificado um ID de paciente, filtrar apenas esse paciente
      if (specificPatientId) {
        query = query.eq('id_paciente', parseInt(specificPatientId));
      }

      const { data, error } = await query.order('data_cadastro', { ascending: false });

      if (error) {
        console.error("Erro ao carregar pacientes:", error);
        toast.error("Erro ao carregar pacientes");
        return;
      }

      console.log("Pacientes carregados:", data);
      setPatients(data || []);
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Erro inesperado ao carregar pacientes");
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos da paginação
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
  const startIndex = (currentPage - 1) * patientsPerPage;
  const endIndex = startIndex + patientsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateAge = (birthDateString: string) => {
    const birthDate = new Date(birthDateString);
    const currentDate = new Date();
    
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    
    // Ajustar idade se ainda não fez aniversário no ano atual
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
      age = age - 1;
    }
    
    return age;
  };

  const getSexBadgeColor = (sexo: string) => {
    return sexo === "masculino" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800";
  };

  const handleEdit = (patientId: number) => {
    navigate(`/cadastro-paciente?edit_id=${patientId}`);
  };

  const handleDelete = async (patientId: number, patientName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o paciente ${patientName}?`)) {
      try {
        const { error } = await supabase
          .from('dpacientes')
          .update({ 
            ativo: false, 
            data_exclusao: new Date().toISOString() 
          })
          .eq('id_paciente', patientId);

        if (error) {
          console.error("Erro ao excluir paciente:", error);
          toast.error("Erro ao excluir paciente");
          return;
        }

        toast.success("Paciente excluído com sucesso!");
        loadPatients();
      } catch (error) {
        console.error("Erro inesperado:", error);
        toast.error("Erro inesperado ao excluir paciente");
      }
    }
  };

  const handleMeasurements = (patientId: number) => {
    console.log("Navegando para medidas com paciente ID:", patientId);
    navigate(`/cadastro-medidas?paciente_id=${patientId}`);
  };

  const handleEvolution = (patientId: number) => {
    navigate(`/evolucao-paciente?paciente_id=${patientId}`);
  };

  if (loading) {
    return (
      <Layout title="Lista de Pacientes">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Carregando pacientes...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Lista de Pacientes" showBackButton={!specificPatientId}>
      <div className="space-y-6">
        {/* Controles superiores */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>
                {specificPatientId ? "Paciente Selecionado" : "Pacientes Cadastrados"}
              </CardTitle>
              <Button onClick={() => navigate("/cadastro-paciente")} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo Paciente
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome do paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabela de pacientes */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data Nascimento</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Sexo</TableHead>
                    <TableHead>Raça/Cor</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentPatients.map((patient) => (
                      <TableRow key={patient.id_paciente} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{patient.nome}</TableCell>
                        <TableCell>{formatDate(patient.data_nascimento)}</TableCell>
                        <TableCell>{calculateAge(patient.data_nascimento)} anos</TableCell>
                        <TableCell>
                          <Badge className={getSexBadgeColor(patient.sexo)}>
                            {patient.sexo === "masculino" ? "M" : "F"}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{patient.raca}</TableCell>
                        <TableCell>{formatDate(patient.data_cadastro)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEvolution(patient.id_paciente)}
                              className="h-8 w-8 p-0"
                              title="Ver Evolução"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMeasurements(patient.id_paciente)}
                              className="h-8 w-8 p-0"
                              title="Cadastrar Medidas"
                            >
                              <Ruler className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(patient.id_paciente)}
                              className="h-8 w-8 p-0"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(patient.id_paciente, patient.nome)}
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Paginação */}
        {filteredPatients.length > patientsPerPage && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredPatients.length)} de {filteredPatients.length} pacientes
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas - só mostrar quando não é um paciente específico */}
        {!specificPatientId && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">{patients.length}</div>
                <div className="text-sm text-gray-600">Total de Pacientes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {patients.filter(p => p.sexo === "masculino").length}
                </div>
                <div className="text-sm text-gray-600">Pacientes Masculinos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-pink-600">
                  {patients.filter(p => p.sexo === "feminino").length}
                </div>
                <div className="text-sm text-gray-600">Pacientes Femininos</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PatientsList;
