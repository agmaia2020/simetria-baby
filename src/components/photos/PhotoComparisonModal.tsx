import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Camera, 
  X, 
  Plus, 
  ArrowRight, 
  Trash2, 
  FileDown,
  ChevronDown,
  ChevronUp,
  Check
} from "lucide-react";

// Importar tipo do pdfExport
import { PhotoPairForPdf } from "@/utils/pdfExport";

// Re-exportar o tipo para uso externo
export type PhotoPairForExport = PhotoPairForPdf;

// Tipos
interface PatientPhoto {
  id_foto: number;
  id_paciente: number;
  data_foto: string;
  posicao: number;
  photo_path: string;
  legenda: string | null;
  photo_url?: string;
}

interface PhotoPair {
  id: number;
  before: PatientPhoto | null;
  after: PatientPhoto | null;
}

interface PhotoComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (pairs: PhotoPairForExport[]) => void;
  onExportWithoutPhotos: () => void;
  pacienteId: number | null;
  isExporting?: boolean;
}

const MAX_PAIRS = 4;

const PhotoComparisonModal = ({
  isOpen,
  onClose,
  onExport,
  onExportWithoutPhotos,
  pacienteId,
  isExporting = false,
}: PhotoComparisonModalProps) => {
  const [photos, setPhotos] = useState<PatientPhoto[]>([]);
  const [photosByDate, setPhotosByDate] = useState<Record<string, PatientPhoto[]>>({});
  const [pairs, setPairs] = useState<PhotoPair[]>([{ id: 1, before: null, after: null }]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectingFor, setSelectingFor] = useState<{ pairId: number; type: 'before' | 'after' } | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Carregar fotos do paciente
  useEffect(() => {
    if (!isOpen || !pacienteId) return;

    const loadPhotos = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("ffotos_paciente")
          .select("*")
          .eq("id_paciente", pacienteId)
          .order("data_foto", { ascending: true })
          .order("posicao", { ascending: true });

        if (error) throw error;

        // Gerar URLs assinadas
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
        const grouped = photosWithUrls.reduce((acc: Record<string, PatientPhoto[]>, photo) => {
          const date = photo.data_foto;
          if (!acc[date]) acc[date] = [];
          acc[date].push(photo);
          return acc;
        }, {});

        setPhotosByDate(grouped);

        // Expandir todas as datas por padrão
        setExpandedDates(new Set(Object.keys(grouped)));
      } catch (error) {
        toast.error("Erro ao carregar fotos");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, [isOpen, pacienteId]);

  // Resetar estado ao fechar
  useEffect(() => {
    if (!isOpen) {
      setPairs([{ id: 1, before: null, after: null }]);
      setSelectingFor(null);
      setExpandedDates(new Set());
    }
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateLong = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleAddPair = () => {
    if (pairs.length >= MAX_PAIRS) {
      toast.error(`Máximo de ${MAX_PAIRS} pares permitido.`);
      return;
    }
    const newId = Math.max(...pairs.map((p) => p.id)) + 1;
    setPairs([...pairs, { id: newId, before: null, after: null }]);
  };

  const handleRemovePair = (pairId: number) => {
    if (pairs.length === 1) {
      // Se for o último par, apenas limpa as fotos
      setPairs([{ id: 1, before: null, after: null }]);
    } else {
      setPairs(pairs.filter((p) => p.id !== pairId));
    }
  };

  const handleSelectPhoto = (photo: PatientPhoto) => {
    if (!selectingFor) return;

    const { pairId, type } = selectingFor;

    setPairs((prev) =>
      prev.map((pair) => {
        if (pair.id !== pairId) return pair;

        // Validar que "depois" é posterior a "antes"
        if (type === "after" && pair.before) {
          if (new Date(photo.data_foto) <= new Date(pair.before.data_foto)) {
            toast.error("A foto 'Depois' deve ter data posterior à foto 'Antes'.");
            return pair;
          }
        }

        if (type === "before" && pair.after) {
          if (new Date(photo.data_foto) >= new Date(pair.after.data_foto)) {
            toast.error("A foto 'Antes' deve ter data anterior à foto 'Depois'.");
            return pair;
          }
        }

        return { ...pair, [type]: photo };
      })
    );

    setSelectingFor(null);
  };

  const handleClearPhoto = (pairId: number, type: 'before' | 'after') => {
    setPairs((prev) =>
      prev.map((pair) => {
        if (pair.id !== pairId) return pair;
        return { ...pair, [type]: null };
      })
    );
  };

  const toggleDateExpanded = (date: string) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const handleExport = () => {
    // Filtrar pares completos
    const completePairs = pairs.filter((p) => p.before && p.after);

    if (completePairs.length === 0) {
      toast.error("Selecione pelo menos um par completo (Antes e Depois).");
      return;
    }

    const pairsForExport: PhotoPairForExport[] = completePairs.map((pair) => ({
      before: {
        url: pair.before!.photo_url || "",
        date: pair.before!.data_foto,
        legenda: pair.before!.legenda,
      },
      after: {
        url: pair.after!.photo_url || "",
        date: pair.after!.data_foto,
        legenda: pair.after!.legenda,
      },
    }));

    onExport(pairsForExport);
  };

  const completePairsCount = pairs.filter((p) => p.before && p.after).length;
  const hasAnySelection = pairs.some((p) => p.before || p.after);
  const sortedDates = Object.keys(photosByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Verificar se uma foto já está selecionada em algum par
  const isPhotoSelected = (photoId: number) => {
    return pairs.some(
      (p) => p.before?.id_foto === photoId || p.after?.id_foto === photoId
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Selecionar fotos comparativas
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-gray-500">Carregando fotos...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Camera className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhuma foto cadastrada para este paciente.</p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Instruções */}
              <p className="text-sm text-gray-600">
                Selecione até {MAX_PAIRS} pares de fotos para comparação (Antes → Depois).
                A foto "Antes" deve ter data anterior à foto "Depois".
              </p>

              {/* Lista de Pares */}
              <div className="space-y-4">
                {pairs.map((pair, index) => (
                  <div
                    key={pair.id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-700">
                        Par {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePair(pair.id)}
                        className="h-8 w-8 text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Foto Antes */}
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 mb-2">ANTES</p>
                        {pair.before ? (
                          <div className="relative group">
                            <img
                              src={pair.before.photo_url}
                              alt="Antes"
                              className="w-full h-32 object-cover rounded-lg border-2 border-blue-500"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg">
                              {formatDate(pair.before.data_foto)}
                            </div>
                            <button
                              onClick={() => handleClearPhoto(pair.id, 'before')}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectingFor({ pairId: pair.id, type: 'before' })}
                            className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                              selectingFor?.pairId === pair.id && selectingFor?.type === 'before'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                            }`}
                          >
                            <Plus className="w-6 h-6 text-gray-400" />
                            <span className="text-xs text-gray-500 mt-1">Selecionar</span>
                          </button>
                        )}
                      </div>

                      {/* Seta */}
                      <ArrowRight className="w-6 h-6 text-gray-400 flex-shrink-0" />

                      {/* Foto Depois */}
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 mb-2">DEPOIS</p>
                        {pair.after ? (
                          <div className="relative group">
                            <img
                              src={pair.after.photo_url}
                              alt="Depois"
                              className="w-full h-32 object-cover rounded-lg border-2 border-green-500"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg">
                              {formatDate(pair.after.data_foto)}
                            </div>
                            <button
                              onClick={() => handleClearPhoto(pair.id, 'after')}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectingFor({ pairId: pair.id, type: 'after' })}
                            className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                              selectingFor?.pairId === pair.id && selectingFor?.type === 'after'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                            }`}
                          >
                            <Plus className="w-6 h-6 text-gray-400" />
                            <span className="text-xs text-gray-500 mt-1">Selecionar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Botão Adicionar Par */}
                {pairs.length < MAX_PAIRS && (
                  <Button
                    variant="outline"
                    onClick={handleAddPair}
                    className="w-full border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar par comparativo ({pairs.length}/{MAX_PAIRS})
                  </Button>
                )}
              </div>

              {/* Galeria de Fotos para Seleção */}
              {selectingFor && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-gray-700">
                      Selecione a foto "{selectingFor.type === 'before' ? 'Antes' : 'Depois'}" para o Par {pairs.findIndex(p => p.id === selectingFor.pairId) + 1}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectingFor(null)}
                    >
                      Cancelar
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {sortedDates.map((date) => (
                      <div key={date} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleDateExpanded(date)}
                          className="w-full flex items-center justify-between p-2 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          <span className="text-sm font-medium">{formatDateLong(date)}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {photosByDate[date].length} foto(s)
                            </span>
                            {expandedDates.has(date) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </button>

                        {expandedDates.has(date) && (
                          <div className="p-2 grid grid-cols-4 gap-2">
                            {photosByDate[date].map((photo) => {
                              const selected = isPhotoSelected(photo.id_foto);
                              const currentPair = pairs.find(p => p.id === selectingFor.pairId);
                              
                              // Validar se a foto pode ser selecionada baseado nas datas
                              let canSelect = !selected;
                              if (canSelect && selectingFor.type === 'after' && currentPair?.before) {
                                canSelect = new Date(photo.data_foto) > new Date(currentPair.before.data_foto);
                              }
                              if (canSelect && selectingFor.type === 'before' && currentPair?.after) {
                                canSelect = new Date(photo.data_foto) < new Date(currentPair.after.data_foto);
                              }

                              return (
                                <button
                                  key={photo.id_foto}
                                  onClick={() => canSelect && handleSelectPhoto(photo)}
                                  disabled={!canSelect}
                                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                                    selected
                                      ? 'border-gray-300 opacity-50 cursor-not-allowed'
                                      : canSelect
                                      ? 'border-transparent hover:border-blue-500 cursor-pointer'
                                      : 'border-gray-200 opacity-40 cursor-not-allowed'
                                  }`}
                                >
                                  <img
                                    src={photo.photo_url}
                                    alt={`Foto ${photo.posicao}`}
                                    className="w-full h-20 object-cover"
                                  />
                                  {selected && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                      <Check className="w-6 h-6 text-white" />
                                    </div>
                                  )}
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-0.5 text-center">
                                    Foto {photo.posicao}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
          <span className="text-sm text-gray-500 mr-auto">
            {completePairsCount} par(es) completo(s)
          </span>
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              onExportWithoutPhotos();
            }}
            disabled={isExporting}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar sem fotos
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || completePairsCount === 0}
          >
            <FileDown className="w-4 h-4 mr-2" />
            {isExporting ? 'Exportando...' : `Exportar com ${completePairsCount} par(es)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoComparisonModal;