import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { RotateCw, X } from 'lucide-react';
import { uploadPhoto } from '../lib/api.js';
import { useResumeStore } from '../store/resume.js';

interface PhotoCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onSuccess: (url: string) => void;
}

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({ imageSrc, onClose, onSuccess }) => {
  const { data } = useResumeStore();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onCropComplete = useCallback((_croppedArea: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const createCroppedImage = async (): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context error');

    ctx.save();
    ctx.translate(400, 400);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-400, -400);

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      800,
      800
    );
    ctx.restore();

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to blob failed'));
        },
        'image/webp',
        0.9
      );
    });
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      const blob = await createCroppedImage();
      const res = await uploadPhoto(data.id, blob);
      onSuccess(res.photoUrl);
      onClose();
    } catch (err) {
      console.error('Failed to crop photo:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(26_28_30_/_0.32)]">
      <div className="relative w-full max-w-lg p-6 bg-[var(--surface)] text-[var(--ink)] rounded-[var(--radius-2)] border border-[var(--rule)] shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-voice text-xl font-bold">Кадрирование фото</h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="relative w-full h-72 bg-black/5 rounded-[var(--radius-1)] overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--ink-2)]">Масштаб</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="accent-[var(--lazur)]"
            />
          </div>

          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--rule)] rounded-[var(--radius-1)] hover:bg-[var(--rule)]/20 transition-colors"
          >
            <RotateCw size={14} strokeWidth={1.5} />
            <span>Повернуть</span>
          </button>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--rule)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[var(--rule-strong)] rounded-[var(--radius-1)] text-[var(--ink)] hover:bg-[var(--rule)]/20 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isUploading}
            className="px-5 py-2 text-sm bg-[var(--lazur)] text-white rounded-[var(--radius-1)] hover:bg-[var(--lazur-strong)] font-medium transition-colors"
          >
            {isUploading ? 'Сохранение…' : 'Применить'}
          </button>
        </div>
      </div>
    </div>
  );
};
