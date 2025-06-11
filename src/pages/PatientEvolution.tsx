
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

interface PatientData {
  id: number;
  nome: string;
  dataNascimento: string;
  sexo: string;
}

interface MeasurementData {
  id: number;
  dataMedicao: string;
  pc: number | null;
  ap: number | null;
  bp: number | null;
  pd: number | null;
  pe: number | null;
  td: number | null;
  te: number | null;
  ci: number | null;
  ciClass: string;
  cvai: number | null;
  cvaiClass: string;
  tbc: number | null;
  tbcClass: string;
}

const PatientEvolution = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pacienteId = searchParams.get("paciente_id");

  const [patientInfo, setPatientInfo] = useState<PatientData>({
    id: 1,
    nome: "João Silva",
    dataNascimento: "01/01/1990",
    sexo: "Masculino"
  });

  const [measurements, setMeasurements] = useState<MeasurementData[]>([
    {
      id: 1,
      dataMedicao: "2024-01-15",
      pc: 520,
      ap: 180,
      bp: 140,
      pd: 95,
      pe: 98,
      td: 125,
      te: 123,
      ci: 77.8,
      ciClass: "Normal",
      cvai: 3.2,
      cvaiClass: "Normal",
      tbc: 2.0,
      tbcClass: "Leve"
    },
    {
      id: 2,
      dataMedicao: "2024-02-15",
      pc: 525,
      ap: 182,
      bp: 142,
      pd: 96,
      pe: 100,
      td: 126,
      te: 125,
      tbc: 1.0,
      tbcClass: "Leve",
      ci: 78.0,
      ciClass: "Normal",
      cvai: 4.2,
      cvaiClass: "Leve"
    },
    {
      id: 3,
      dataMedicao: "2024-03-15",
      pc: 530,
      ap: 184,
      bp: 144,
      pd: 97,
      pe: 102,
      td: 127,
      te: 126,
      tbc: 1.0,
      tbcClass: "Leve",
      ci: 78.3,
      ciClass: "Normal",
      cvai: 5.2,
      cvaiClass: "Leve"
    }
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<MeasurementData>>({});

  useEffect(() => {
    if (!pacienteId) {
      toast.error("ID do paciente não encontrado");
      navigate("/lista-pacientes");
      return;
    }
    // Aqui você carregaria os dados do Supabase
  }, [pacienteId, navigate]);

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

  const handleEdit = (measurement: MeasurementData) => {
    setEditingId(measurement.id);
    setEditingData(measurement);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingData) return;

    const updatedMeasurements = measurements.map(m => 
      m.id === editingId ? { ...m, ...editingData } : m
    );
    setMeasurements(updatedMeasurements);
    setEditingId(null);
    setEditingData({});
    toast.success("Medida atualizada com sucesso!");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta medida?")) {
      setMeasurements(measurements.filter(m => m.id !== id));
      toast.success("Medida excluída com sucesso!");
    }
  };

  const calculateIndices = (data: Partial<MeasurementData>) => {
    const { ap, bp, pd, pe, td, te } = data;
    
    let ci = null, ciClass = "-";
    if (ap && bp && ap > 0) {
      ci = (bp / ap) * 100;
      ciClass = ci < 75 ? "Dolicocefalia" : ci <= 85 ? "Normal" : "Braquicefalia";
    }
    
    let cvai = null, cvaiClass = "-";
    if (pd && pe && Math.min(pd, pe) > 0) {
      cvai = Math.abs((pe - pd) / Math.min(pd, pe)) * 100;
      cvaiClass = cvai < 3.5 ? "Normal" : cvai <= 6.25 ? "Leve" : cvai <= 8.75 ? "Moderada" : "Grave";
    }
    
    let tbc = null, tbcClass = "-";
    if (td && te) {
      tbc = Math.abs(td - te);
      tbcClass = tbc <= 3 ? "Leve" : tbc <= 6 ? "Moderada" : "Severa";
    }
    
    return { ci, ciClass, cvai, cvaiClass, tbc, tbcClass };
  };

  const handleInputChange = (field: keyof MeasurementData, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    const updatedData = { ...editingData, [field]: numValue };
    const indices = calculateIndices(updatedData);
    setEditingData({ ...updatedData, ...indices });
  };

  // Dados para os gráficos
  const chartData = measurements.map(m => ({
    data: formatDate(m.dataMedicao),
    CI: m.ci,
    CVAI: m.cvai
  }));

  return (
    <Layout title="Evolução do Paciente" backPath="/lista-pacientes">
      <div className="space-y-6">
        {/* Informações do Paciente */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex gap-6">
                <div><strong>Nome:</strong> {patientInfo.nome}</div>
                <div><strong>Nascimento:</strong> {patientInfo.dataNascimento}</div>
                <div><strong>Sexo:</strong> {patientInfo.sexo}</div>
              </div>
              <Button variant="outline" onClick={() => navigate("/lista-pacientes")}>
                Lista de Pacientes
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Gráficos */}
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
                  <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="5 5" />
                  <ReferenceLine y={85} stroke="#ef4444" strokeDasharray="5 5" />
                  <Area 
                    type="monotone" 
                    dataKey="CI" 
                    stroke="#2563eb" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="text-xs text-gray-500 mt-2">
                Faixa normal: 75-85% | Linhas tracejadas indicam limites
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
                  <ReferenceLine y={3.5} stroke="#10b981" strokeDasharray="5 5" />
                  <ReferenceLine y={6.25} stroke="#f59e0b" strokeDasharray="5 5" />
                  <ReferenceLine y={8.75} stroke="#ef4444" strokeDasharray="5 5" />
                  <Area 
                    type="monotone" 
                    dataKey="CVAI" 
                    stroke="#7c3aed" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="text-xs text-gray-500 mt-2">
                Normal: &lt;3.5% | Leve: 3.5-6.25% | Moderada: 6.25-8.75% | Grave: &gt;8.75%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Histórico */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Medidas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
                    <TableRow key={measurement.id}>
                      {editingId === measurement.id ? (
                        <>
                          <TableCell>
                            <Input
                              type="date"
                              value={editingData.dataMedicao || ""}
                              onChange={(e) => setEditingData({ ...editingData, dataMedicao: e.target.value })}
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
                          <TableCell>{formatDate(measurement.dataMedicao)}</TableCell>
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
                                onClick={() => handleDelete(measurement.id)}
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PatientEvolution;
