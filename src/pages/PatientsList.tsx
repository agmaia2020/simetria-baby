// Seus imports originais, 100% preservados
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Imports para o novo layout consistente
import { UserCircle, ArrowLeft, Search, Edit, Trash2, Plus, Ruler, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import novoLogo from "@/assets/Logo Modificado.png";
import { useAuth } from "@/hooks/useAuth";

// Sua interface, mantida como está
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
  // --- TODA A SUA LÓGICA DE COMPONENTE PERMANECE INTACTA ---
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 10;
  const specificPatientId = searchParams.get('paciente_id');

  useEffect(() => {
    loadPatients();
  }, [specificPatientId]);

  // Todas as suas funções (loadPatients, formatDate, calculateAge, etc.)
  // permanecem exatamente as mesmas. Nenhuma alteração foi feita nelas.
  const loadPatients = async () => {
    try {
      setLoading(true);
      let query = supabase.from('dpacientes').select('*').eq('ativo', true);
      if (specificPatientId) {
        query = query.eq('id_paciente', parseInt(specificPatientId));
      }
      const { data, error } = await query.order('data_cadastro', { ascending: false });
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      toast.error("Erro ao carregar pacientes");
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
  const startIndex = (currentPage - 1) * patientsPerPage;
  const endIndex = startIndex + patientsPerPage;
  const currentPatients = filteredPatients.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');
  
  const calculateAge = (birthDateString: string) => {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let ageYears = today.getFullYear() - birthDate.getFullYear();
    let ageMonths = today.getMonth() - birthDate.getMonth();
    if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < birthDate.getDate())) {
      ageYears--;
      ageMonths = (ageMonths + 12) % 12;
    }
    if (ageYears > 0) return `${ageYears} ano(s)`;
    return `${ageMonths} mes(es)`;
  };

  const getSexBadgeColor = (sexo: string) => sexo === "masculino" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800";
  const handleEdit = (id: number) => navigate(`/cadastro-paciente?edit_id=${id}`);
  const handleMeasurements = (id: number) => navigate(`/cadastro-medidas?paciente_id=${id}`);
  const handleEvolution = (id: number) => navigate(`/evolucao-paciente?paciente_id=${id}`);

  const handleDelete = async (patientId: number, patientName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o paciente ${patientName}?`)) {
      try {
        const { error } = await supabase.from('dpacientes').update({ ativo: false, data_exclusao: new Date().toISOString() }).eq('id_paciente', patientId);
        if (error) throw error;
        toast.success("Paciente excluído com sucesso!");
        loadPatients();
      } catch (error) {
        toast.error("Erro ao excluir paciente");
      }
    }
  };
  // --- FIM DA SUA LÓGICA DE COMPONENTE ---

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 1. Header Padrão e Consistente */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 cursor-pointer group" onClick={() => navigate('/')}><img src={novoLogo} alt="Logo Simetrik Baby" className="h-10 w-auto" /><span className="text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Simetrik Baby</span></div>
            <div className="flex items-center space-x-3">{user && user.name && (<span className="text-base font-medium text-gray-700 hidden sm:block">{user.name}</span>)}<button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"><UserCircle className="w-7 h-7" /></button></div>
          </div>
        </div>
      </header>

      {/* 2. Conteúdo Principal da Página */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Cabeçalho da página com Título, Busca e Botão de Ação */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Voltar"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lista de Pacientes</h1>
              <p className="mt-1 text-lg text-gray-600">Gerencie, edite e visualize os pacientes cadastrados.</p>
            </div>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <div className="relative flex-1 sm:flex-initial"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
            <Button onClick={() => navigate("/cadastro-paciente")} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Novo</Button>
          </div>
        </div>

        {/* Tabela de Pacientes */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Idade</TableHead><TableHead>Sexo</TableHead><TableHead>Raça/Cor</TableHead><TableHead>Data Cadastro</TableHead><TableHead className="text-center">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? (<TableRow><TableCell colSpan={6} className="text-center py-12">Carregando pacientes...</TableCell></TableRow>) : currentPatients.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center py-12">{searchTerm ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado."}</TableCell></TableRow>) : (
                    currentPatients.map((patient) => (
                      <TableRow key={patient.id_paciente} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{patient.nome}</TableCell>
                        <TableCell>{calculateAge(patient.data_nascimento)}</TableCell>
                        <TableCell><Badge variant="outline" className={getSexBadgeColor(patient.sexo)}>{patient.sexo.charAt(0).toUpperCase()}</Badge></TableCell>
                        <TableCell className="capitalize">{patient.raca}</TableCell>
                        <TableCell>{formatDate(patient.data_cadastro)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEvolution(patient.id_paciente)} title="Ver Evolução"><TrendingUp className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleMeasurements(patient.id_paciente)} title="Cadastrar Medidas"><Ruler className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(patient.id_paciente)} title="Editar Paciente"><Edit className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(patient.id_paciente, patient.nome)} className="hover:text-red-600" title="Excluir Paciente"><Trash2 className="w-4 h-4" /></Button>
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
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">Mostrando {startIndex + 1} a {Math.min(endIndex, filteredPatients.length)} de {filteredPatients.length}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-sm font-medium">Página {currentPage} de {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </main>

      {/* 3. Rodapé Padrão */}
      <footer className="mt-16 pb-8 text-center text-gray-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8"><p className="mt-2 text-xs">&copy; {new Date().getFullYear()} Simetrik Baby. Todos os direitos reservados.</p></div>
      </footer>
    </div>
  );
};

export default PatientsList;
