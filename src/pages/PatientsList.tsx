
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Edit, Trash2, Plus, Ruler } from "lucide-react";
import Layout from "@/components/Layout";

interface Patient {
  id: number;
  nome: string;
  dataNascimento: string;
  sexo: string;
  raca: string;
  dataCadastro: string;
}

const PatientsList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dados simulados
  const [patients] = useState<Patient[]>([
    {
      id: 1,
      nome: "João Silva Santos",
      dataNascimento: "1990-01-15",
      sexo: "masculino",
      raca: "branca",
      dataCadastro: "2024-01-15"
    },
    {
      id: 2,
      nome: "Maria Oliveira",
      dataNascimento: "1985-03-22",
      sexo: "feminino",
      raca: "parda",
      dataCadastro: "2024-01-14"
    },
    {
      id: 3,
      nome: "Carlos Alberto",
      dataNascimento: "1992-07-08",
      sexo: "masculino",
      raca: "preta",
      dataCadastro: "2024-01-13"
    }
  ]);

  const filteredPatients = patients.filter(patient =>
    patient.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getSexBadgeColor = (sexo: string) => {
    return sexo === "masculino" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800";
  };

  const handleEdit = (patientId: number) => {
    navigate(`/cadastro-paciente?edit_id=${patientId}`);
  };

  const handleDelete = (patientId: number, patientName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o paciente ${patientName}?`)) {
      toast.success("Paciente excluído com sucesso!");
      // Aqui você faria a exclusão no Supabase
    }
  };

  const handleMeasurements = (patientId: number) => {
    navigate(`/cadastro-medidas?paciente_id=${patientId}`);
  };

  return (
    <Layout title="Lista de Pacientes">
      <div className="space-y-6">
        {/* Controles superiores */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Pacientes Cadastrados</CardTitle>
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
                    <TableHead>Sexo</TableHead>
                    <TableHead>Raça/Cor</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map((patient) => (
                      <TableRow key={patient.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{patient.nome}</TableCell>
                        <TableCell>{formatDate(patient.dataNascimento)}</TableCell>
                        <TableCell>
                          <Badge className={getSexBadgeColor(patient.sexo)}>
                            {patient.sexo === "masculino" ? "M" : "F"}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{patient.raca}</TableCell>
                        <TableCell>{formatDate(patient.dataCadastro)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMeasurements(patient.id)}
                              className="h-8 w-8 p-0"
                              title="Cadastrar Medidas"
                            >
                              <Ruler className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(patient.id)}
                              className="h-8 w-8 p-0"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(patient.id, patient.nome)}
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

        {/* Estatísticas */}
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
      </div>
    </Layout>
  );
};

export default PatientsList;
