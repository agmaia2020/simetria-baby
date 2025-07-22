
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Edit, Trash2, Save, X, TrendingUp } from "lucide-react";
import Layout from "@/components/Layout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useMeasurements, Measurement } from "@/hooks/useMeasurements";

interface PatientData {
  id_paciente: number;
  nome: string;
  data_nascimento: string;
  sexo: string;
}

interface MeasurementDisplay extends Measurement {
  ciClass: string;
  cvaiClass: string;
  tbcClass: string;
}

const PatientEvolution = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pacienteId = searchParams.get("paciente_id");
  const { getMeasurementsByPatientId, updateMeasurement, deleteMeasurement, loading } = useMeasurements();

  const [patientInfo, setPatientInfo] = useState<PatientData | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementDisplay[]>([]);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<MeasurementDisplay>>({});

  useEffect(() => {
    if (!pacienteId) {
      toast.error("ID do paciente não encontrado");
      navigate("/lista-pacientes");
      return;
    }
    loadPatientData();
    loadMeasurements();
  }, [pacienteId, navigate]);

  const loadPatientData = async () => {
    if (!pacienteId) return;

    try {
      setLoadingPatient(true);
      console.log("Carregando dados do paciente:", pacienteId);
      
      const { data, error } = await supabase
        .from('dpacientes')
        .select('id_paciente, nome, data_nascimento, sexo')
        .eq('id_paciente', parseInt(pacienteId))
        .eq('ativo', true)
        .single();

      if (error) {
        console.error("Erro ao carregar paciente:", error);
        toast.error("Erro ao carregar dados do paciente");
        navigate("/lista-pacientes");
        return;
      }

      if (data) {
        setPatientInfo({
          id_paciente: data.id_paciente,
          nome: data.nome,
          data_nascimento: new Date(data.data_nascimento).toLocaleDateString('pt-BR'),
          sexo: data.sexo === 'masculino' ? 'Masculino' : 'Feminino'
        });
        console.log("Dados do paciente carregados:", data);
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Erro inesperado ao carregar paciente");
      navigate("/lista-pacientes");
    } finally {
      setLoadingPatient(false);
    }
  };

  const loadMeasurements = async () => {
    if (!pacienteId) return;

    const measurementsData = await getMeasurementsByPatientId(parseInt(pacienteId));
    const measurementsWithClassifications = measurementsData.map(measurement => ({
      ...measurement,
      ciClass: getClassification(measurement.ci, 'ci'),
      cvaiClass: getClassification(measurement.cvai, 'cvai'),
      tbcClass: getClassification(measurement.tbc, 'tbc')
    }));
    setMeasurements(measurementsWithClassifications);
  };

  const getClassification = (value: number | null, type: 'ci' | 'cvai' | 'tbc'): string => {
    if (value === null) return "-";
    
    switch (type) {
      case 'ci':
        if (value < 75) return "Dolicocefalia";
        if (value <= 85) return "Normal";
        return "Braquicefalia";
      case 'cvai':
        if (value < 3.5) return "Normal";
        if (value <= 6.25) return "Leve";
        if (value <= 8.75) return "Moderada";
        return "Grave";
      case 'tbc':
        if (value <= 3) return "Leve";
        if (value <= 6) return "Moderada";
        return "Severa";
      default:
        return "-";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

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

  const handleEdit = (measurement: MeasurementDisplay) => {
    setEditingId(measurement.id_medida!);
    setEditingData(measurement);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingData.id_medida) return;

    const updateData = {
      data_medicao: editingData.data_medicao,
      pc: editingData.pc,
      ap: editingData.ap,
      bp: editingData.bp,
      pd: editingData.pd,
      pe: editingData.pe,
      td: editingData.td,
      te: editingData.te
    };

    const success = await updateMeasurement(editingId, updateData);
    if (success) {
      setEditingId(null);
      setEditingData({});
      toast.success("Medida atualizada com sucesso!");
      loadMeasurements(); // Recarregar dados
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta medida?")) {
      const success = await deleteMeasurement(id);
      if (success) {
        toast.success("Medida excluída com sucesso!");
        loadMeasurements(); // Recarregar dados
      }
    }
  };

  const calculateIndices = (data: Partial<MeasurementDisplay>) => {
    const { ap, bp, pd, pe, td, te } = data;
    
    let ci = null, ciClass = "-";
    if (ap && bp && ap > 0) {
      ci = (bp / ap) * 100;
      ciClass = ci < 75 ? "Dolicocefalia" : ci <= 85 ? "Normal" : "Braquicefalia";
    }
    
    let cvai = null, cvaiClass = "-";
    if (pd && pe && Math.max(pd, pe) > 0) {
      cvai = ((Math.max(pd, pe) - Math.min(pd, pe)) / Math.max(pd, pe)) * 100;
      cvaiClass = cvai < 3.5 ? "Normal" : cvai <= 6.25 ? "Leve" : cvai <= 8.75 ? "Moderada" : "Grave";
    }
    
    let tbc = null, tbcClass = "-";
    if (td && te) {
      tbc = Math.abs(td - te);
      tbcClass = tbc <= 3 ? "Leve" : tbc <= 6 ? "Moderada" : "Severa";
    }
    
    return { ci, ciClass, cvai, cvaiClass, tbc, tbcClass };
  };

  const handleInputChange = (field: keyof MeasurementDisplay, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    const updatedData = { ...editingData, [field]: numValue };
    const indices = calculateIndices(updatedData);
    setEditingData({ ...updatedData, ...indices });
  };

  // Dados para os gráficos
  const chartData = measurements.map(m => ({
    data: formatDate(m.data_medicao),
    CI: m.ci,
    CVAI: m.cvai
  }));

  if (loadingPatient) {
    return (
      <Layout title="Evolução do Paciente" backPath="/lista-pacientes">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Carregando dados do paciente...</div>
        </div>
      </Layout>
    );
  }

  if (!patientInfo) {
    return (
      <Layout title="Evolução do Paciente" backPath="/lista-pacientes">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">Paciente não encontrado</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Evolução do Paciente" backPath="/lista-pacientes">
      <div className="space-y-6">
        {/* Informações do Paciente */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex gap-6">
                <div><strong>Nome:</strong> {patientInfo.nome}</div>
                <div><strong>Nascimento:</strong> {patientInfo.data_nascimento}</div>
                <div><strong>Sexo:</strong> {patientInfo.sexo}</div>
              </div>
              <Button variant="outline" onClick={() => navigate("/lista-pacientes")}>
                Lista de Pacientes
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Gráficos */}
        {measurements.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Evolução do Índice Cefálico (CI)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis domain={[65, 95]} />
                    <Tooltip />
                    <defs>
                      <linearGradient id="ciGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    {/* Áreas de fundo coloridas */}
                    <Area 
                      type="monotone" 
                      dataKey={() => 95} 
                      fill="#3b82f6" 
                      fillOpacity={0.1} 
                      stroke="none"
                      stackId="bg"
                    />
                    <Area 
                      type="monotone" 
                      dataKey={() => 85} 
                      fill="#10b981" 
                      fillOpacity={0.15} 
                      stroke="none"
                      stackId="bg"
                    />
                    <Area 
                      type="monotone" 
                      dataKey={() => 75} 
                      fill="#3b82f6" 
                      fillOpacity={0.1} 
                      stroke="none"
                      stackId="bg"
                    />
                    <ReferenceLine y={75} stroke="#10b981" strokeDasharray="5 5" />
                    <ReferenceLine y={85} stroke="#f59e0b" strokeDasharray="5 5" />
                    <Line 
                      type="monotone" 
                      dataKey="CI" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ fill: "#2563eb", strokeWidth: 2, r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                    <span>Dolicocefalia: &lt;75%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                    <span>Normal: 75-85%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                    <span>Braquicefalia: &gt;85%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Evolução do CVAI (%)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis domain={[0, 15]} />
                    <Tooltip />
                    <defs>
                      <linearGradient id="cvaiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    {/* Áreas de fundo coloridas para as faixas */}
                    <Area 
                      type="monotone" 
                      dataKey={() => 15} 
                      fill="#ef4444" 
                      fillOpacity={0.1} 
                      stroke="none"
                      stackId="bg"
                    />
                    <Area 
                      type="monotone" 
                      dataKey={() => 8.75} 
                      fill="#f97316" 
                      fillOpacity={0.15} 
                      stroke="none"
                      stackId="bg"
                    />
                    <Area 
                      type="monotone" 
                      dataKey={() => 6.25} 
                      fill="#f59e0b" 
                      fillOpacity={0.15} 
                      stroke="none"
                      stackId="bg"
                    />
                    <Area 
                      type="monotone" 
                      dataKey={() => 3.5} 
                      fill="#10b981" 
                      fillOpacity={0.15} 
                      stroke="none"
                      stackId="bg"
                    />
                    <ReferenceLine y={3.5} stroke="#10b981" strokeDasharray="5 5" />
                    <ReferenceLine y={6.25} stroke="#f59e0b" strokeDasharray="5 5" />
                    <ReferenceLine y={8.75} stroke="#ef4444" strokeDasharray="5 5" />
                    <Line 
                      type="monotone" 
                      dataKey="CVAI" 
                      stroke="#7c3aed" 
                      strokeWidth={3}
                      dot={{ fill: "#7c3aed", strokeWidth: 2, r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                    <span>Normal: &lt;3.5%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                    <span>Leve: 3.5-6.25%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded"></div>
                    <span>Moderada: 6.25-8.75%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded"></div>
                    <span>Grave: &gt;8.75%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabela de Histórico */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Medidas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">Carregando medidas...</div>
              </div>
            ) : measurements.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">Nenhuma medida encontrada para este paciente</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>PC (mm)</TableHead>
                      <TableHead>AP (mm)</TableHead>
                      <TableHead>BP (mm)</TableHead>
                      <TableHead>PD (mm)</TableHead>
                      <TableHead>PE (mm)</TableHead>
                      <TableHead>TD (mm)</TableHead>
                      <TableHead>TE (mm)</TableHead>
                      <TableHead>CI</TableHead>
                      <TableHead>Class.</TableHead>
                      <TableHead>CVAI</TableHead>
                      <TableHead>Class.</TableHead>
                      <TableHead>TBC</TableHead>
                      <TableHead>Class.</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {measurements.map((measurement) => (
                      <TableRow key={measurement.id_medida}>
                        {editingId === measurement.id_medida ? (
                          <>
                            <TableCell>
                              <Input
                                type="date"
                                value={editingData.data_medicao?.split('T')[0] || ""}
                                onChange={(e) => setEditingData({ ...editingData, data_medicao: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.1"
                                value={editingData.pc || ""}
                                onChange={(e) => handleInputChange("pc", e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.1"
                                value={editingData.ap || ""}
                                onChange={(e) => handleInputChange("ap", e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.1"
                                value={editingData.bp || ""}
                                onChange={(e) => handleInputChange("bp", e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.1"
                                value={editingData.pd || ""}
                                onChange={(e) => handleInputChange("pd", e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.1"
                                value={editingData.pe || ""}
                                onChange={(e) => handleInputChange("pe", e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.1"
                                value={editingData.td || ""}
                                onChange={(e) => handleInputChange("td", e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.1"
                                value={editingData.te || ""}
                                onChange={(e) => handleInputChange("te", e.target.value)}
                              />
                            </TableCell>
                            <TableCell>{editingData.ci?.toFixed(2) || "-"}</TableCell>
                            <TableCell>
                              <Badge className={getClassificationColor(editingData.ciClass || "")}>
                                {editingData.ciClass || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell>{editingData.cvai?.toFixed(2) || "-"}%</TableCell>
                            <TableCell>
                              <Badge className={getClassificationColor(editingData.cvaiClass || "")}>
                                {editingData.cvaiClass || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell>{editingData.tbc?.toFixed(1) || "-"} mm</TableCell>
                            <TableCell>
                              <Badge className={getClassificationColor(editingData.tbcClass || "")}>
                                {editingData.tbcClass || "-"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveEdit}>
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{formatDate(measurement.data_medicao)}</TableCell>
                            <TableCell>{measurement.pc}</TableCell>
                            <TableCell>{measurement.ap}</TableCell>
                            <TableCell>{measurement.bp}</TableCell>
                            <TableCell>{measurement.pd}</TableCell>
                            <TableCell>{measurement.pe}</TableCell>
                            <TableCell>{measurement.td}</TableCell>
                            <TableCell>{measurement.te}</TableCell>
                            <TableCell>{measurement.ci?.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge className={getClassificationColor(measurement.ciClass)}>
                                {measurement.ciClass}
                              </Badge>
                            </TableCell>
                            <TableCell>{measurement.cvai?.toFixed(2)}%</TableCell>
                            <TableCell>
                              <Badge className={getClassificationColor(measurement.cvaiClass)}>
                                {measurement.cvaiClass}
                              </Badge>
                            </TableCell>
                            <TableCell>{measurement.tbc?.toFixed(1)} mm</TableCell>
                            <TableCell>
                              <Badge className={getClassificationColor(measurement.tbcClass)}>
                                {measurement.tbcClass}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(measurement)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(measurement.id_medida!)}
                                  className="hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientEvolution;
