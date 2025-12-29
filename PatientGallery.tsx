import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Imports de layout e ícones
import { ArrowLeft, Camera, Trash2, X, Calendar, Download } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import novoLogo from "@/assets/Logo Modificado.png";
import { useAuth } from "@/hooks/useAuth";

// Tipos
type AnguloFoto = "superior" | "frontal" | "lateral_esquerda" | "lateral_direita";

interface PatientPhoto {
  id_foto: number;
  id_paciente: number;
  usuario_id: string;
  data_foto: string;
  angulo: AnguloFoto;
  photo_path: string;
  legenda: string | null;
  data_cadastro: string;
  photo_url?: string;
}

interface PatientData {
  id_paciente: number;
  nome: string;
  data_nascimento: string;
  sexo: string;
}

interface PhotosByDate {
  [date: string]: PatientPhoto[];
}

const ANGULO_LABELS: Record<AnguloFoto, string> = {
  superior: "Vista Superior",
  frontal: "Vista Frontal",
  lateral_esquerda: "Lateral Esquerda",
  lateral_direita: "Lateral Direita",
};

const PatientGallery = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const pacienteId = searchParams.get("paciente_id");

  const [patientInfo, setPatientInfo] = useState<PatientData | null>(null);
  const [photos, setPhotos] = useState<PatientPhoto[]>([]);
  const [photosByDate, setPhotosByDate] = useState<PhotosByDate>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<PatientPhoto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carregar dados do paciente
  useEffect(() => {
    if (!pacienteId || !user) return;

    const loadPatientData = async () => {
      try {
        const { data, error } = await supabase
          .from("dpacientes")
          .select("id_paciente, nome, data_nascimento, sexo")
          .eq("id_paciente", parseInt(pacienteId))
          .eq("ativo", true)
          .single();

        if (error) {
          toast.error("Paciente não encontrado");
          navigate("/lista-pacientes");
          return;
        }

        setPatientInfo({
          id_paciente: data.id_paciente,
          nome: data.nome,
          data_nascimento: new Date(data.data_nascimento + "T00:00:00").toLocaleDateString("pt-BR"),
          sexo: data.sexo === "masculino" ? "Masculino" : "Feminino",
        });
      } catch (error) {
        toast.error("Erro ao carregar dados do paciente");
      }
    };

    loadPatientData();
  }, [pacienteId, user, navigate]);

  // Carregar fotos do paciente
  useEffect(() => {
    if (!pacienteId || !user) return;

    const loadPhotos = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("ffotos_paciente")
          .select("*")
          .eq("id_paciente", parseInt(pacienteId))
          .order("data_foto", { ascending: false });

        if (error) throw error;

        // Gerar URLs assinadas para cada foto
        const photosWithUrls = await Promise.all(
          (data || []).map(async (photo) => {
            const { data: signedUrl } = await supabase.storage
              .from("paciente_fotos")
              .createSignedUrl(photo.photo_path, 3600); // URL válida por 1 hora

            return {
              ...photo,
              photo_url: signedUrl?.signedUrl || "",
            };
          })
        );

        setPhotos(photosWithUrls);

        // Agrupar por data
        const grouped = photosWithUrls.reduce((acc: PhotosByDate, photo) => {
          const date = photo.data_foto;
          if (!acc[date]) acc[date] = [];
          acc[date].push(photo);
          return acc;
        }, {});

        setPhotosByDate(grouped);
      } catch (error) {
        toast.error("Erro ao carregar fotos");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, [pacienteId, user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleDeletePhoto = async (photo: PatientPhoto) => {
    if (!window.confirm("Deseja realmente excluir esta foto? Esta ação não pode ser desfeita.")) {
      return;
    }

    setIsDeleting(true);
    try {
      // Deletar do Storage
      const { error: storageError } = await supabase.storage
        .from("paciente_fotos")
        .remove([photo.photo_path]);

      if (storageError) {
        throw new Error("Erro ao deletar arquivo do storage");
      }

      // Deletar do banco
      const { error: dbError } = await supabase
        .from("ffotos_paciente")
        .delete()
        .eq("id_foto", photo.id_foto);

      if (dbError) {
        throw new Error("Erro ao deletar registro do banco");
      }

      // Atualizar estado local
      const updatedPhotos = photos.filter((p) => p.id_foto !== photo.id_foto);
      setPhotos(updatedPhotos);

      // Reagrupar por data
      const grouped = updatedPhotos.reduce((acc: PhotosByDate, p) => {
        const date = p.data_foto;
        if (!acc[date]) acc[date] = [];
        acc[date].push(p);
        return acc;
      }, {});
      setPhotosByDate(grouped);

      setSelectedPhoto(null);
      toast.success("Foto excluída com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir foto");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPhoto = async (photo: PatientPhoto) => {
    if (!photo.photo_url) return;

    try {
      const response = await fetch(photo.photo_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${patientInfo?.nome || "paciente"}_${photo.data_foto}_${photo.angulo}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Erro ao baixar foto");
    }
  };

  const sortedDates = Object.keys(photosByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center space-x-4 cursor-pointer group"
              onClick={() => navigate("/")}
            >
              <img src={novoLogo} alt="Logo Simetrik Baby" className="h-10 w-auto" />
              <span className="text-2xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                Simetrik Baby
              </span>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Cabeçalho da página */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate("/lista-pacientes")}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Voltar para Lista"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          {patientInfo ? (
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                <Camera className="inline-block w-8 h-8 mr-2 text-blue-600" />
                Galeria de Fotos
              </h1>
              <p className="mt-1 text-lg text-gray-600">{patientInfo.nome}</p>
            </div>
          ) : (
            <div className="text-lg text-gray-500">Carregando...</div>
          )}
        </div>

        {/* Conteúdo */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Carregando fotos...</div>
          </div>
        ) : photos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Camera className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                Nenhuma foto cadastrada
              </h3>
              <p className="text-gray-500 mb-6">
                As fotos do paciente aparecerão aqui após serem cadastradas.
              </p>
              <Button onClick={() => navigate(`/cadastro-medidas?paciente_id=${pacienteId}`)}>
                Ir para Cadastro de Medidas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    {formatDate(date)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {photosByDate[date].map((photo) => (
                      <div
                        key={photo.id_foto}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <img
                          src={photo.photo_url}
                          alt={ANGULO_LABELS[photo.angulo]}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-white text-sm font-medium">
                            {ANGULO_LABELS[photo.angulo]}
                          </p>
                          {photo.legenda && (
                            <p className="text-white/80 text-xs truncate">{photo.legenda}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Resumo */}
        {photos.length > 0 && (
          <div className="mt-8 text-center text-gray-500 text-sm">
            Total: {photos.length} foto(s) em {sortedDates.length} data(s)
          </div>
        )}
      </main>

      {/* Modal de Visualização */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {ANGULO_LABELS[selectedPhoto.angulo]}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(selectedPhoto.data_foto)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDownloadPhoto(selectedPhoto)}
                  title="Baixar foto"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeletePhoto(selectedPhoto)}
                  disabled={isDeleting}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  title="Excluir foto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Imagem */}
            <div className="p-4">
              <img
                src={selectedPhoto.photo_url}
                alt={ANGULO_LABELS[selectedPhoto.angulo]}
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
              />
            </div>

            {/* Legenda */}
            {selectedPhoto.legenda && (
              <div className="px-4 pb-4">
                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                  <strong>Legenda:</strong> {selectedPhoto.legenda}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rodapé */}
      <footer className="mt-16 pb-8 text-center text-gray-500 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
            <a href="/termos-de-servico" className="hover:text-blue-600 transition-colors">
              Termos de Serviço
            </a>
            <span className="hidden md:inline">•</span>
            <a href="/politica-de-privacidade" className="hover:text-blue-600 transition-colors">
              Política de Privacidade
            </a>
            <span className="hidden md:inline">•</span>
            <a href="mailto:suporte@simetrikbaby.com" className="hover:text-blue-600 transition-colors">
              Suporte
            </a>
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

export default PatientGallery;
