
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Layout from "@/components/Layout";

interface MeasurementResults {
  ci: number | null;
  ciClassification: string;
  cvai: number | null;
  cvaiClassification: string;
  tbc: number | null;
  tbcClassification: string;
}

const MeasurementsRegistration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pacienteId = searchParams.get("paciente_id");

  const [patientInfo, setPatientInfo] = useState({
    nome: "João Silva",
    dataNascimento: "01/01/1990",
    sexo: "Masculino"
  });

  const [measurements, setMeasurements] = useState({
    dataCadastro: new Date().toISOString().split('T')[0],
    pc: "",
    ap: "",
    bp: "",
    pd: "",
    pe: "",
    td: "",
    te: ""
  });

  const [results, setResults] = useState<MeasurementResults>({
    ci: null,
    ciClassification: "",
    cvai: null,
    cvaiClassification: "",
    tbc: null,
    tbcClassification: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!pacienteId) {
      toast.error("ID do paciente não encontrado");
      navigate("/lista-pacientes");
      return;
    }
    // Aqui você carregaria os dados do paciente do Supabase
  }, [pacienteId, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }));
    calculateResults({ ...measurements, [field]: value });
  };

  const calculateResults = (data: typeof measurements) => {
    const bp = parseFloat(data.bp);
    const ap = parseFloat(data.ap);
    const pd = parseFloat(data.pd);
    const pe = parseFloat(data.pe);
    const td = parseFloat(data.td);
    const te = parseFloat(data.te);

    let newResults: MeasurementResults = {
      ci: null,
      ciClassification: "",
      cvai: null,
      cvaiClassification: "",
      tbc: null,
      tbcClassification: ""
    };

    // Calcular CI (Índice Cefálico)
    if (bp && ap && ap > 0) {
      const ci = (bp / ap) * 100;
      newResults.ci = ci;
      if (ci < 75) {
        newResults.ciClassification = "Dolicocefalia";
      } else if (ci <= 85) {
        newResults.ciClassification = "Normal";
      } else {
        newResults.ciClassification = "Braquicefalia";
      }
    }

    // Calcular CVAI (Índice de Assimetria)
    if (pd && pe) {
      const minVal = Math.min(pd, pe);
      if (minVal > 0) {
        const cvai = Math.abs((pe - pd) / minVal) * 100;
        newResults.cvai = cvai;
        if (cvai < 3.5) {
          newResults.cvaiClassification = "Normal";
        } else if (cvai <= 6.25) {
          newResults.cvaiClassification = "Leve";
        } else if (cvai <= 8.75) {
          newResults.cvaiClassification = "Moderada";
        } else {
          newResults.cvaiClassification = "Grave";
        }
      }
    }

    // Calcular TBC (Torção da Base do Crânio)
    if (td && te) {
      const tbc = Math.abs(td - te);
      newResults.tbc = tbc;
      if (tbc <= 3) {
        newResults.tbcClassification = "Leve";
      } else if (tbc <= 6) {
        newResults.tbcClassification = "Moderada";
      } else {
        newResults.tbcClassification = "Severa";
      }
    }

    setResults(newResults);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const today = new Date().toISOString().split('T')[0];
    if (measurements.dataCadastro > today) {
      toast.error("A data de cadastro não pode ser posterior à data atual");
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular salvamento no Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Medidas cadastradas com sucesso!");
      
    } catch (error) {
      toast.error("Erro ao salvar as medidas");
    } finally {
      setIsLoading(false);
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification.toLowerCase()) {
      case "normal": return "text-green-600 bg-green-50 border-green-200";
      case "leve": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "moderada": return "text-orange-600 bg-orange-50 border-orange-200";
      case "grave": case "severa": return "text-red-600 bg-red-50 border-red-200";
      case "dolicocefalia": return "text-blue-600 bg-blue-50 border-blue-200";
      case "braquicefalia": return "text-purple-600 bg-purple-50 border-purple-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <Layout title="Cadastro de Medidas Cranianas">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Informações do Paciente */}
        <div className="lg:col-span-2">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Informações do Paciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Nome:</strong> {patientInfo.nome}
                </div>
                <div>
                  <strong>Data de Nascimento:</strong> {patientInfo.dataNascimento}
                </div>
                <div>
                  <strong>Sexo:</strong> {patientInfo.sexo}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Medidas */}
        <Card>
          <CardHeader>
            <CardTitle>Medidas Cranianas</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataCadastro">Data de Cadastro</Label>
                <Input
                  id="dataCadastro"
                  type="date"
                  value={measurements.dataCadastro}
                  onChange={(e) => handleInputChange("dataCadastro", e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pc">Perímetro Craniano (PC) - mm</Label>
                  <Input
                    id="pc"
                    type="number"
                    step="0.1"
                    value={measurements.pc}
                    onChange={(e) => handleInputChange("pc", e.target.value)}
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ap">Altura Posterior (AP) - mm</Label>
                  <Input
                    id="ap"
                    type="number"
                    step="0.1"
                    value={measurements.ap}
                    onChange={(e) => handleInputChange("ap", e.target.value)}
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bp">Bitragem Posterior (BP) - mm</Label>
                  <Input
                    id="bp"
                    type="number"
                    step="0.1"
                    value={measurements.bp}
                    onChange={(e) => handleInputChange("bp", e.target.value)}
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pd">Profundidade Direita (PD) - mm</Label>
                  <Input
                    id="pd"
                    type="number"
                    step="0.1"
                    value={measurements.pd}
                    onChange={(e) => handleInputChange("pd", e.target.value)}
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pe">Profundidade Esquerda (PE) - mm</Label>
                  <Input
                    id="pe"
                    type="number"
                    step="0.1"
                    value={measurements.pe}
                    onChange={(e) => handleInputChange("pe", e.target.value)}
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="td">TRAGUS D - mm</Label>
                  <Input
                    id="td"
                    type="number"
                    step="0.1"
                    value={measurements.td}
                    onChange={(e) => handleInputChange("td", e.target.value)}
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="te">TRAGUS E - mm</Label>
                  <Input
                    id="te"
                    type="number"
                    step="0.1"
                    value={measurements.te}
                    onChange={(e) => handleInputChange("te", e.target.value)}
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? "Salvando..." : "Salvar Medidas"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/lista-pacientes")}
                  className="flex-1"
                >
                  Lista de Pacientes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Resultados em Tempo Real */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados em Tempo Real</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Índice Cefálico */}
            <div className="p-4 rounded-lg border bg-gray-50">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                Índice Cefálico (CI)
              </h4>
              <div className="text-2xl font-bold mb-2">
                {results.ci ? results.ci.toFixed(2) : "-"}
              </div>
              {results.ciClassification && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getClassificationColor(results.ciClassification)}`}>
                  {results.ciClassification}
                </span>
              )}
              <div className="text-xs text-gray-500 mt-2">
                Fórmula: (BP/AP)*100<br/>
                &lt;75: dolicocefalia | 75–85: normal | &gt;85: braquicefalia
              </div>
            </div>

            {/* Índice de Assimetria */}
            <div className="p-4 rounded-lg border bg-gray-50">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                Índice de Assimetria (CVAI)
              </h4>
              <div className="text-2xl font-bold mb-2">
                {results.cvai ? `${results.cvai.toFixed(2)}%` : "-"}
              </div>
              {results.cvaiClassification && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getClassificationColor(results.cvaiClassification)}`}>
                  {results.cvaiClassification}
                </span>
              )}
              <div className="text-xs text-gray-500 mt-2">
                Fórmula: (PE-PD/min(PE,PD))*100<br/>
                &lt;3,5%: normal | 3,5–6,25%: leve | 6,25–8,75%: moderada | &gt;8,75%: grave
              </div>
            </div>

            {/* Torção da Base do Crânio */}
            <div className="p-4 rounded-lg border bg-gray-50">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                Torção da Base do Crânio (TBC)
              </h4>
              <div className="text-2xl font-bold mb-2">
                {results.tbc ? `${results.tbc.toFixed(1)} mm` : "-"}
              </div>
              {results.tbcClassification && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getClassificationColor(results.tbcClassification)}`}>
                  {results.tbcClassification}
                </span>
              )}
              <div className="text-xs text-gray-500 mt-2">
                Fórmula: |Trágus D – Trágus E|<br/>
                0-3mm: leve | 4-6mm: moderada | &gt;6mm: severa
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MeasurementsRegistration;
