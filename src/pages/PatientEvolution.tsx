// Seus imports originais, 100% preservados
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
// CORREÇÃO: Adicionado ReferenceArea para os gráficos
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useMeasurements, Measurement } from "@/hooks/useMeasurements";

// Imports para o novo layout consistente
import { UserCircle, ArrowLeft, Edit, Trash2, Save, X, TrendingUp, Info } from "lucide-react";
import novoLogo from "@/assets/Logo Modificado.png";
import { useAuth } from "@/hooks/useAuth";

// Suas interfaces, mantidas como estão
interface PatientData { id_paciente: number; nome: string; data_nascimento: string; sexo: string; }
interface MeasurementDisplay extends Measurement { ciClass: string; cvaiClass: string; tbcClass: string; }

const PatientEvolution = () => {
  // --- TODA A SUA LÓGICA DE COMPONENTE PERMANECE INTACTA ---
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const pacienteId = searchParams.get("paciente_id");
  const { getMeasurementsByPatientId, updateMeasurement, deleteMeasurement, loading } = useMeasurements();

  const [patientInfo, setPatientInfo] = useState<PatientData | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementDisplay[]>([]);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<MeasurementDisplay>>({});

  useEffect(() => {
    if (!pacienteId) { toast.error("ID do paciente não encontrado"); navigate("/lista-pacientes"); return; }
    loadPatientData();
    loadMeasurements();
  }, [pacienteId, navigate]);

  const loadPatientData = async () => {
    if (!pacienteId) return;
    try {
      setLoadingPatient(true);
      const { data, error } = await supabase.from('dpacientes').select('id_paciente, nome, data_nascimento, sexo').eq('id_paciente', parseInt(pacienteId)).eq('ativo', true).single();
      if (error) throw error;
      setPatientInfo({ id_paciente: data.id_paciente, nome: data.nome, data_nascimento: new Date(data.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR'), sexo: data.sexo === 'masculino' ? 'Masculino' : 'Feminino' });
    } catch (error) { toast.error("Erro ao carregar dados do paciente"); navigate("/lista-pacientes"); } 
    finally { setLoadingPatient(false); }
  };

  const loadMeasurements = async () => {
    if (!pacienteId) return;
    const data = await getMeasurementsByPatientId(parseInt(pacienteId));
    const classifiedData = data.map(m => {
      const indices = calculateIndices(m);
      return { ...m, ...indices };
    });
    classifiedData.sort((a, b) => new Date(a.data_medicao).getTime() - new Date(b.data_medicao).getTime());
    setMeasurements(classifiedData);
  };

  const calculateIndices = (data: Partial<Measurement>) => {
    const { ap, bp, pd, pe, td, te } = data;
    let ci = data.ci, cvai = data.cvai, tbc = data.tbc;
    if (ci === null && ap && bp && ap > 0) ci = (bp / ap) * 100;
    if (cvai === null && pd && pe) {
        const maxVal = Math.max(pd, pe);
        if (maxVal > 0) cvai = (Math.abs(pd - pe) / maxVal) * 100;
    }
    if (tbc === null && td && te) tbc = Math.abs(td - te);
    return { ci, cvai, tbc, ciClass: getClassification(ci, 'ci'), cvaiClass: getClassification(cvai, 'cvai'), tbcClass: getClassification(tbc, 'tbc') };
  };

  const getClassification = (value: number | null, type: 'ci' | 'cvai' | 'tbc'): string => {
    if (value === null) return "-";
    switch (type) {
      case 'ci': if (value < 75) return "Dolicocefalia"; if (value <= 85) return "Normal"; return "Braquicefalia";
      case 'cvai': if (value < 3.5) return "Normal"; if (value <= 6.25) return "Leve"; if (value <= 8.75) return "Moderada"; return "Grave";
      case 'tbc': if (value <= 3) return "Leve"; if (value <= 6) return "Moderada"; return "Severa";
      default: return "-";
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const getClassificationColor = (classification: string) => {
    switch (classification.toLowerCase()) {
      case "normal": return "bg-green-100 text-green-800";
      case "leve": return "bg-yellow-100 text-yellow-800";
      case "moderada": return "bg-orange-100 text-orange-800";
      case "grave": case "severa": return "bg-red-100 text-red-800";
      case "dolicocefalia": return "bg-blue-100 text-blue-800";
      case "braquicefalia": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const handleEdit = (m: MeasurementDisplay) => { setEditingId(m.id_medida!); setEditingData(m); };
  const handleCancelEdit = () => { setEditingId(null); setEditingData({}); };
  const handleDelete = async (id: number) => { if (window.confirm("Tem certeza?")) { const ok = await deleteMeasurement(id); if (ok) { toast.success("Medida excluída!"); loadMeasurements(); } } };
  const handleSaveEdit = async () => {
    if (!editingId) return;
    const indices = calculateIndices(editingData);
    const updateData = { ...editingData, ...indices };
    const success = await updateMeasurement(editingId, updateData);
    if (success) { handleCancelEdit(); toast.success("Medida atualizada!"); loadMeasurements(); }
  };
  const handleInputChange = (field: keyof Measurement, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    const updated = { ...editingData, [field]: numValue };
    const indices = calculateIndices(updated);
    setEditingData({ ...updated, ...indices });
  };

  const chartData = measurements.map(m => ({ data: formatDate(m.data_medicao), CI: m.ci, CVAI: m.cvai }));

  // --- DADOS PARA AS LEGENDAS ---
  const ciLegend = [
    { name: "Dolicocefalia (< 75)", color: "bg-blue-500" },
    { name: "Normal (75-85)", color: "bg-green-500" },
    { name: "Braquicefalia (> 85)", color: "bg-purple-500" },
  ];

  const cvaiLegend = [
    { name: "Normal (< 3.5%)", color: "bg-green-500" },
    { name: "Leve (3.5-6.25%)", color: "bg-yellow-500" },
    { name: "Moderada (6.25-8.75%)", color: "bg-orange-500" },
    { name: "Grave (> 8.75%)", color: "bg-red-500" },
  ];
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
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate("/lista-pacientes")} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Voltar para Lista"><ArrowLeft className="w-6 h-6 text-gray-700" /></button>
          {loadingPatient ? (<div className="text-lg text-gray-500">Carregando paciente...</div>) : patientInfo ? (
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{patientInfo.nome}</h1>
              <p className="mt-1 text-lg text-gray-600">Evolução das medidas cranianas</p>
            </div>
          ) : (<div className="text-lg text-red-500">Paciente não encontrado.</div>)}
        </div>

        {/* GRÁFICOS CORRIGIDOS */}
        {!loading && measurements.length > 1 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Gráfico CI */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" />Evolução do Índice Cefálico (CI)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" fontSize={12} />
                    <YAxis domain={[60, 110]} fontSize={12} />
                    <Tooltip />
                    <ReferenceArea y1={85} y2={110} fill="#a855f7" strokeOpacity={0.3} fillOpacity={0.1} />
                    <ReferenceArea y1={75} y2={85} fill="#22c55e" strokeOpacity={0.3} fillOpacity={0.15} />
                    <ReferenceArea y1={60} y2={75} fill="#3b82f6" strokeOpacity={0.3} fillOpacity={0.1} />
                    <Area type="monotone" dataKey="CI" stroke="#1e40af" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} name="Índice Cefálico" />
                  </AreaChart>
                </ResponsiveContainer>
                {/* LEGENDA CUSTOMIZADA */}
                <div className="flex justify-center items-center gap-4 mt-4 text-xs text-gray-600">
                  {ciLegend.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${item.color} opacity-70`}></div>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Gráfico CVAI */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-purple-600" />Evolução do CVAI (%)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" fontSize={12} />
                    <YAxis domain={[0, 15]} fontSize={12} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                    <ReferenceArea y1={8.75} y2={15} fill="#ef4444" strokeOpacity={0.3} fillOpacity={0.1} />
                    <ReferenceArea y1={6.25} y2={8.75} fill="#f97316" strokeOpacity={0.3} fillOpacity={0.15} />
                    <ReferenceArea y1={3.5} y2={6.25} fill="#f59e0b" strokeOpacity={0.3} fillOpacity={0.15} />
                    <ReferenceArea y1={0} y2={3.5} fill="#22c55e" strokeOpacity={0.3} fillOpacity={0.15} />
                    <Area type="monotone" dataKey="CVAI" stroke="#7c3aed" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} name="CVAI" />
                  </AreaChart>
                </ResponsiveContainer>
                {/* LEGENDA CUSTOMIZADA */}
                <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-4 text-xs text-gray-600">
                  {cvaiLegend.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${item.color} opacity-70`}></div>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mensagem para medição única */}
        {!loading && measurements.length === 1 && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="p-6 flex items-center gap-4">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-800">Aguardando mais dados</h4>
                <p className="text-sm text-blue-700">Os gráficos de evolução aparecerão aqui quando houver duas ou mais medições registradas.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Histórico */}
        <Card>
          <CardHeader><CardTitle>Histórico de Medidas</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead><TableHead>PC</TableHead><TableHead>AP</TableHead><TableHead>BP</TableHead><TableHead>PD</TableHead><TableHead>PE</TableHead><TableHead>TD</TableHead><TableHead>TE</TableHead>
                    <TableHead>CI</TableHead><TableHead>CVAI</TableHead><TableHead>TBC</TableHead><TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={12} className="text-center h-24">Carregando medidas...</TableCell></TableRow>
                  ) : measurements.length === 0 ? (
                    <TableRow><TableCell colSpan={12} className="text-center h-24 text-gray-500">Nenhuma medida encontrada para este paciente.</TableCell></TableRow>
                  ) : (
                    measurements.map((m) => (
                      <TableRow key={m.id_medida}>
                        {editingId === m.id_medida ? (
                          <>
                            <TableCell><Input type="date" value={editingData.data_medicao?.split('T')[0] || ""} onChange={(e) => setEditingData({ ...editingData, data_medicao: e.target.value })} className="w-36" /></TableCell>
                            {[ 'pc', 'ap', 'bp', 'pd', 'pe', 'td', 'te'].map(field => (
                              <TableCell key={field}><Input type="number" step="0.1" value={editingData[field as keyof Measurement] || ""} onChange={(e) => handleInputChange(field as keyof Measurement, e.target.value)} className="w-20" /></TableCell>
                            ))}
                            <TableCell>{editingData.ci?.toFixed(2)}</TableCell>
                            <TableCell>{editingData.cvai?.toFixed(2)}%</TableCell>
                            <TableCell>{editingData.tbc?.toFixed(1)}</TableCell>
                            <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={handleSaveEdit}><Save className="w-4 h-4" /></Button><Button size="icon" variant="ghost" onClick={handleCancelEdit}><X className="w-4 h-4" /></Button></div></TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{formatDate(m.data_medicao)}</TableCell>
                            <TableCell>{m.pc}</TableCell><TableCell>{m.ap}</TableCell><TableCell>{m.bp}</TableCell><TableCell>{m.pd}</TableCell><TableCell>{m.pe}</TableCell><TableCell>{m.td}</TableCell><TableCell>{m.te}</TableCell>
                            <TableCell><Badge variant="outline" className={getClassificationColor(m.ciClass)}>{m.ci?.toFixed(2)}</Badge></TableCell>
                            <TableCell><Badge variant="outline" className={getClassificationColor(m.cvaiClass)}>{m.cvai?.toFixed(2)}%</Badge></TableCell>
                            <TableCell><Badge variant="outline" className={getClassificationColor(m.tbcClass)}>{m.tbc?.toFixed(1)}</Badge></TableCell>
                            <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => handleEdit(m)}><Edit className="w-4 h-4" /></Button><Button size="icon" variant="ghost" onClick={() => handleDelete(m.id_medida!)} className="hover:text-red-600"><Trash2 className="w-4 h-4" /></Button></div></TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* 3. Rodapé Padrão */}
      <footer className="mt-16 pb-8 text-center text-gray-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8"><p className="mt-2 text-xs">&copy; {new Date().getFullYear()} Simetrik Baby. Todos os direitos reservados.</p></div>
      </footer>
    </div>
  );
};

export default PatientEvolution;
