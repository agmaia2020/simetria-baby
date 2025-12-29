import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Camera, X, Upload, Loader2, Plus, Image } from "lucide-react";
import imageCompression from "browser-image-compression";

// Detectar se é mobile
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Tipos
interface PhotoData {
  file: File | null;
  preview: string | null;
  legenda: string;
}

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteId: number | null;
  pacienteNome: string;
  usuarioId: string;
}

const MAX_PHOTOS = 4;

const PhotoUploadModal = ({
  isOpen,
  onClose,
  pacienteId,
  pacienteNome,
  usuarioId,
}: PhotoUploadModalProps) => {
  const [dataFoto, setDataFoto] = useState(new Date().toISOString().split("T")[0]);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [existingCount, setExistingCount] = useState(0);

  // Verificar quantas fotos já existem para essa data
  useEffect(() => {
    if (!isOpen || !pacienteId || !dataFoto) return;

    const checkExistingPhotos = async () => {
      const { count, error } = await supabase
        .from("ffotos_paciente")
        .select("*", { count: "exact", head: true })
        .eq("id_paciente", pacienteId)
        .eq("data_foto", dataFoto);

      if (!error && count !== null) {
        setExistingCount(count);
      }
    };

    checkExistingPhotos();
  }, [isOpen, pacienteId, dataFoto]);

  // Limpar previews ao fechar o modal
  useEffect(() => {
    if (!isOpen) {
      photos.forEach((photo) => {
        if (photo.preview) URL.revokeObjectURL(photo.preview);
      });
      setPhotos([]);
      setDataFoto(new Date().toISOString().split("T")[0]);
      setExistingCount(0);
    }
  }, [isOpen]);

  const handleFileSelect = async (index: number, file: File | null) => {
    if (!file) return;

    // Validar tipo
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }

    // Validar tamanho (10MB antes da compressão)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    try {
      // Comprimir imagem
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      // Criar preview
      const preview = URL.createObjectURL(compressedFile);

      // Revogar preview antigo se existir
      if (photos[index]?.preview) {
        URL.revokeObjectURL(photos[index].preview!);
      }

      setPhotos((prev) => {
        const newPhotos = [...prev];
        newPhotos[index] = { file: compressedFile, preview, legenda: prev[index]?.legenda || "" };
        return newPhotos;
      });
    } catch (error) {
      toast.error("Erro ao processar imagem.");
      console.error(error);
    }
  };

  const handleAddPhoto = () => {
    if (photos.length + existingCount >= MAX_PHOTOS) {
      toast.error(`Limite de ${MAX_PHOTOS} fotos por data atingido.`);
      return;
    }
    setPhotos((prev) => [...prev, { file: null, preview: null, legenda: "" }]);
  };

  const handleRemovePhoto = (index: number) => {
    if (photos[index]?.preview) {
      URL.revokeObjectURL(photos[index].preview!);
    }
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLegendaChange = (index: number, legenda: string) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      if (newPhotos[index]) {
        newPhotos[index] = { ...newPhotos[index], legenda };
      }
      return newPhotos;
    });
  };

  const handleSave = async () => {
    if (!pacienteId || !usuarioId) {
      toast.error("Erro: paciente ou usuário não identificado.");
      return;
    }

    // Filtrar fotos válidas
    const photosToUpload = photos.filter((p) => p.file !== null);

    if (photosToUpload.length === 0) {
      toast.error("Selecione pelo menos uma foto para salvar.");
      return;
    }

    // Verificar limite
    if (photosToUpload.length + existingCount > MAX_PHOTOS) {
      toast.error(`Só é possível adicionar mais ${MAX_PHOTOS - existingCount} foto(s) nesta data.`);
      return;
    }

    setIsUploading(true);

    try {
      // Buscar próxima posição disponível
      const { data: existingPhotos } = await supabase
        .from("ffotos_paciente")
        .select("posicao")
        .eq("id_paciente", pacienteId)
        .eq("data_foto", dataFoto)
        .order("posicao");

      const usedPositions = new Set(existingPhotos?.map((p) => p.posicao) || []);
      const availablePositions: number[] = [];
      for (let i = 1; i <= MAX_PHOTOS; i++) {
        if (!usedPositions.has(i)) availablePositions.push(i);
      }

      for (let i = 0; i < photosToUpload.length; i++) {
        const photo = photosToUpload[i];
        const posicao = availablePositions[i];

        if (!photo.file || posicao === undefined) continue;

        // Definir path no storage
        const fileExt = photo.file.name.split(".").pop() || "jpg";
        const filePath = `${usuarioId}/${pacienteId}/${dataFoto}_foto${posicao}.${fileExt}`;

        // Upload para o Storage
        const { error: uploadError } = await supabase.storage
          .from("paciente_fotos")
          .upload(filePath, photo.file, { upsert: true });

        if (uploadError) {
          throw new Error(`Erro no upload (foto ${posicao}): ${uploadError.message}`);
        }

        // Inserir registro na tabela
        const { error: dbError } = await supabase.from("ffotos_paciente").insert({
          id_paciente: pacienteId,
          usuario_id: usuarioId,
          data_foto: dataFoto,
          posicao: posicao,
          photo_path: filePath,
          legenda: photo.legenda || null,
        });

        if (dbError) {
          throw new Error(`Erro ao salvar registro (foto ${posicao}): ${dbError.message}`);
        }
      }

      toast.success(`${photosToUpload.length} foto(s) salva(s) com sucesso!`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar fotos.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const totalPhotos = photos.filter((p) => p.file !== null).length;
  const availableSlots = MAX_PHOTOS - existingCount;
  const canAddMore = photos.length < availableSlots;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto sm:max-w-3xl w-[95vw] sm:w-full"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Inserir Fotos - {pacienteNome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Data da Foto */}
          <div className="space-y-2">
            <Label htmlFor="data-foto">Data das Fotos *</Label>
            <Input
              id="data-foto"
              type="date"
              value={dataFoto}
              onChange={(e) => setDataFoto(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="max-w-xs"
            />
            {existingCount > 0 && (
              <p className="text-sm text-amber-600">
                Já existem {existingCount} foto(s) nesta data. Você pode adicionar mais {availableSlots}.
              </p>
            )}
          </div>

          {/* Lista de Fotos */}
          <div className="space-y-4">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 space-y-3 bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Foto {index + 1}</Label>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Área de Preview/Upload */}
                {photo.preview ? (
                  <div className="relative">
                    <img
                      src={photo.preview}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (photo.preview) URL.revokeObjectURL(photo.preview);
                        setPhotos((prev) => {
                          const newPhotos = [...prev];
                          newPhotos[index] = { ...newPhotos[index], file: null, preview: null };
                          return newPhotos;
                        });
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : isMobile() ? (
                  /* Mobile: Duas opções - Câmera e Galeria */
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <Camera className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-sm text-gray-500">Tirar Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                      />
                    </label>
                    <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <Image className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-sm text-gray-500">Galeria</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                ) : (
                  /* Desktop: Área de arrastar e soltar */
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Clique ou arraste</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                    />
                  </label>
                )}

                {/* Campo de Legenda */}
                <Input
                  placeholder="Legenda (opcional)"
                  value={photo.legenda}
                  onChange={(e) => handleLegendaChange(index, e.target.value)}
                  maxLength={255}
                />
              </div>
            ))}

            {/* Botão Adicionar Foto */}
            {canAddMore && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddPhoto}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Foto ({photos.length}/{availableSlots})
              </Button>
            )}

            {!canAddMore && photos.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Limite de {MAX_PHOTOS} fotos por data já atingido.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <span className="text-sm text-gray-500 mr-auto">
            {totalPhotos} foto(s) selecionada(s)
          </span>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isUploading || totalPhotos === 0}>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Fotos"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoUploadModal;