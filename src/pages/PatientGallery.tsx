import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Imports de layout e ícones
import { ArrowLeft, Camera, Trash2, X, Calendar, Download, Plus, Edit, Save } from "lucide-react";
import { UserMenu } from "@/components/auth/UserMenu";
import novoLogo from "@/assets/Logo Modificado.png";
import { useAuth } from "@/hooks/useAuth";

// Import do Modal de Fotos
import PhotoUploadModal from "@/components/photos/PhotoUploadModal";

// Tipos
interface PatientPhoto {
  id_foto: number;
  id_paciente: number;
  usuario_id: string;
  data_foto: string;
  posicao: number;
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
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isEditingLegenda, setIsEditingLegenda] = useState(false);
  const [editingLegenda, setEditingLegenda] = useState("");
  const [isSavingLegenda, setIsSavingLegenda] = useState(false);

  // Bloquear scroll do body quando modal está aberto
  useEffect(() => {
    if (selectedPhoto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup ao desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhoto]);

  // Função para carregar/recarregar fotos
  const loadPhotos = async () => {
    if (!pacienteId || !user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ffotos_paciente")
        .select("*")
        .eq("id_paciente", parseInt(pacienteId))
        .order("data_foto", { ascending: true })
        .order("posicao", { ascending: true });

      if (error) throw error;

      // Gerar URLs assinadas para cada foto
      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo) => {
          const { data: signedUrl } = await supabase.storage
            .from("paciente_fotos")
            .createSignedUrl(photo.photo_path, 3600);

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

  // Handler para fechar modal e recarregar fotos
  const handleClosePhotoModal = () => {
    setIsPhotoModalOpen(false);
    loadPhotos(); // Recarrega as fotos após fechar o modal
  };

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
      a.download = `${patientInfo?.nome || "paciente"}_${photo.data_foto}_foto${photo.posicao}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Erro ao baixar foto");
    }
  };

  const handleEditLegenda = () => {
    if (selectedPhoto) {
      setEditingLegenda(selectedPhoto.legenda || "");
      setIsEditingLegenda(true);
    }
  };

  const handleSaveLegenda = async () => {
    if (!selectedPhoto) return;

    setIsSavingLegenda(true);
    try {
      const { error } = await supabase
        .from("ffotos_paciente")
        .update({ legenda: editingLegenda || null })
        .eq("id_foto", selectedPhoto.id_foto);

      if (error) throw error;

      // Atualizar estado local
      const updatedPhoto = { ...selectedPhoto, legenda: editingLegenda || null };
      setSelectedPhoto(updatedPhoto);

      // Atualizar na lista de fotos
      const updatedPhotos = photos.map((p) =>
        p.id_foto === selectedPhoto.id_foto ? updatedPhoto : p
      );
      setPhotos(updatedPhotos);

      // Reagrupar por data
      const grouped = updatedPhotos.reduce((acc: PhotosByDate, p) => {
        const date = p.data_foto;
        if (!acc[date]) acc[date] = [];
        acc[date].push(p);
        return acc;
      }, {});
      setPhotosByDate(grouped);

      setIsEditingLegenda(false);
      toast.success("Legenda atualizada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar legenda");
      console.error(error);
    } finally {
      setIsSavingLegenda(false);
    }
  };

  const handleCancelEditLegenda = () => {
    setIsEditingLegenda(false);
    setEditingLegenda("");
  };

  const sortedDates = Object.keys(photosByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center space-x-4 cursor-pointer group"
              onClick={() => navigate("/home")}
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
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
          
          {/* Botão Inserir Fotos */}
          {patientInfo && (
            <Button
              onClick={() => setIsPhotoModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Inserir Fotos
            </Button>
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
              <p className="text-gray-500">
                As fotos do paciente aparecerão aqui após serem cadastradas.
              </p>
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
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({photosByDate[date].length} foto{photosByDate[date].length > 1 ? "s" : ""})
                    </span>
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
                          alt={`Foto ${photo.posicao}`}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-white text-sm font-medium">
                            Foto {photo.posicao}
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

      {/* Modal de Upload de Fotos */}
      <PhotoUploadModal
        isOpen={isPhotoModalOpen}
        onClose={handleClosePhotoModal}
        pacienteId={patientInfo?.id_paciente || null}
        pacienteNome={patientInfo?.nome || ""}
        usuarioId={user?.id || ""}
      />

      {/* Modal de Visualização */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            if (!isEditingLegenda) {
              setSelectedPhoto(null);
              setIsEditingLegenda(false);
            }
          }}
        >
          <div
            className="relative bg-white rounded-lg max-w-4xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Foto {selectedPhoto.posicao}
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
                  onClick={handleEditLegenda}
                  disabled={isEditingLegenda}
                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                  title="Editar legenda"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeletePhoto(selectedPhoto)}
                  disabled={isDeleting || isEditingLegenda}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  title="Excluir foto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (!isEditingLegenda) {
                      setSelectedPhoto(null);
                      setIsEditingLegenda(false);
                    }
                  }}
                  disabled={isEditingLegenda}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Imagem */}
            <div className="p-4">
              <img
                src={selectedPhoto.photo_url}
                alt={`Foto ${selectedPhoto.posicao}`}
                className="max-w-full max-h-[60vh] object-contain mx-auto rounded-lg"
              />
            </div>

            {/* Legenda */}
            <div className="px-4 pb-4">
              {isEditingLegenda ? (
                <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-gray-700">
                    Editar Legenda
                  </label>
                  <Input
                    placeholder="Digite uma legenda para a foto..."
                    value={editingLegenda}
                    onChange={(e) => setEditingLegenda(e.target.value)}
                    maxLength={255}
                    className="w-full bg-white"
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {editingLegenda.length}/255 caracteres
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEditLegenda}
                        disabled={isSavingLegenda}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveLegenda}
                        disabled={isSavingLegenda}
                      >
                        {isSavingLegenda ? (
                          "Salvando..."
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-1" />
                            Salvar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : selectedPhoto.legenda ? (
                <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                  <strong>Legenda:</strong> {selectedPhoto.legenda}
                </p>
              ) : (
                <p className="text-gray-400 text-sm bg-gray-50 p-3 rounded-lg italic">
                  Sem legenda. Clique no botão de editar para adicionar.
                </p>
              )}
            </div>
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