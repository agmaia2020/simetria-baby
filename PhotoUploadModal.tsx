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
import { Camera, X, Upload, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";

// Tipos
type AnguloFoto = "superior" | "frontal" | "lateral_esquerda" | "lateral_direita";

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

const ANGULOS: { key: AnguloFoto; label: string }[] = [
  { key: "superior", label: "Vista Superior" },
  { key: "frontal", label: "Vista Frontal" },
  { key: "lateral_esquerda", label: "Lateral Esquerda" },
  { key: "lateral_direita", label: "Lateral Direita" },
];

const PhotoUploadModal = ({
  isOpen,
  onClose,
  pacienteId,
  pacienteNome,
  usuarioId,
}: PhotoUploadModalProps) => {
  const [dataFoto, setDataFoto] = useState(new Date().toISOString().split("T")[0]);
  const [photos, setPhotos] = useState<Record<AnguloFoto, PhotoData>>({
    superior: { file: null, preview: null, legenda: "" },
    frontal: { file: null, preview: null, legenda: "" },
    lateral_esquerda: { file: null, preview: null, legenda: "" },
    lateral_direita: { file: null, preview: null, legenda: "" },
  });
  const [isUploading, setIsUploading] = useState(false);

  // Limpar previews ao fechar o modal
  useEffect(() => {
    if (!isOpen) {
      // Revogar URLs de preview para liberar memória
      Object.values(photos).forEach((photo) => {
        if (photo.preview) URL.revokeObjectURL(photo.preview);
      });
      // Resetar estado
      setPhotos({
        superior: { file: null, preview: null, legenda: "" },
        frontal: { file: null, preview: null, legenda: "" },
        lateral_esquerda: { file: null, preview: null, legenda: "" },
        lateral_direita: { file: null, preview: null, legenda: "" },
      });
      setDataFoto(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen]);

  const handleFileSelect = async (angulo: AnguloFoto, file: File | null) => {
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
        maxSizeMB: 0.5, // 500KB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      // Criar preview
      const preview = URL.createObjectURL(compressedFile);

      // Revogar preview antigo se existir
      if (photos[angulo].preview) {
        URL.revokeObjectURL(photos[angulo].preview!);
      }

      setPhotos((prev) => ({
        ...prev,
        [angulo]: { ...prev[angulo], file: compressedFile, preview },
      }));
    } catch (error) {
      toast.error("Erro ao processar imagem.");
      console.error(error);
    }
  };

  const handleRemovePhoto = (angulo: AnguloFoto) => {
    if (photos[angulo].preview) {
      URL.revokeObjectURL(photos[angulo].preview!);
    }
    setPhotos((prev) => ({
      ...prev,
      [angulo]: { file: null, preview: null, legenda: "" },
    }));
  };

  const handleLegendaChange = (angulo: AnguloFoto, legenda: string) => {
    setPhotos((prev) => ({
      ...prev,
      [angulo]: { ...prev[angulo], legenda },
    }));
  };

  const handleSave = async () => {
    if (!pacienteId || !usuarioId) {
      toast.error("Erro: paciente ou usuário não identificado.");
      return;
    }

    // Verificar se há pelo menos uma foto
    const photosToUpload = Object.entries(photos).filter(
      ([_, data]) => data.file !== null
    ) as [AnguloFoto, PhotoData][];

    if (photosToUpload.length === 0) {
      toast.error("Selecione pelo menos uma foto para salvar.");
      return;
    }

    setIsUploading(true);

    try {
      for (const [angulo, data] of photosToUpload) {
        if (!data.file) continue;

        // Definir path no storage
        const fileExt = data.file.name.split(".").pop() || "jpg";
        const filePath = `${usuarioId}/${pacienteId}/${dataFoto}_${angulo}.${fileExt}`;

        // Upload para o Storage
        const { error: uploadError } = await supabase.storage
          .from("patient-photos")
          .upload(filePath, data.file, { upsert: true });

        if (uploadError) {
          throw new Error(`Erro no upload (${angulo}): ${uploadError.message}`);
        }

        // Inserir registro na tabela
        const { error: dbError } = await supabase.from("ffotos_paciente").upsert(
          {
            id_paciente: pacienteId,
            usuario_id: usuarioId,
            data_foto: dataFoto,
            angulo: angulo,
            photo_path: filePath,
            legenda: data.legenda || null,
          },
          { onConflict: "id_paciente,data_foto,angulo" }
        );

        if (dbError) {
          throw new Error(`Erro ao salvar registro (${angulo}): ${dbError.message}`);
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

  const totalPhotos = Object.values(photos).filter((p) => p.file !== null).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
          </div>

          {/* Grid de Fotos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ANGULOS.map(({ key, label }) => (
              <div
                key={key}
                className="border rounded-lg p-4 space-y-3 bg-gray-50"
              >
                <Label className="font-semibold">{label}</Label>

                {/* Área de Preview/Upload */}
                {photos[key].preview ? (
                  <div className="relative">
                    <img
                      src={photos[key].preview!}
                      alt={label}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(key)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      Clique ou arraste
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) =>
                        handleFileSelect(key, e.target.files?.[0] || null)
                      }
                    />
                  </label>
                )}

                {/* Campo de Legenda */}
                <Input
                  placeholder="Legenda (opcional)"
                  value={photos[key].legenda}
                  onChange={(e) => handleLegendaChange(key, e.target.value)}
                  maxLength={255}
                  disabled={!photos[key].file}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <span className="text-sm text-gray-500 mr-auto">
            {totalPhotos} de 4 fotos selecionadas
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
