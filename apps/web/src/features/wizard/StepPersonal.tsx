import React, { useState } from 'react';
import { useResumeStore } from '../../store/resume.js';
import { positions } from '@cvb/shared';
import { PhotoCropModal } from '../../components/PhotoCropModal.js';
import { Upload, Trash2 } from 'lucide-react';
import { deletePhoto } from '../../lib/api.js';

export const StepPersonal: React.FC = () => {
  const { data, updateField } = useResumeStore();
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [positionSuggestions, setPositionSuggestions] = useState<string[]>([]);

  const handlePositionChange = (val: string) => {
    updateField('personal.position', val);
    if (val.trim().length > 1) {
      const lower = val.toLowerCase();
      setPositionSuggestions(positions.filter(p => p.toLowerCase().includes(lower)).slice(0, 5));
    } else {
      setPositionSuggestions([]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setPhotoModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeletePhoto = async () => {
    await deletePhoto(data.id);
    updateField('personal.photoUrl', '');
    updateField('personal.photoKey', '');
  };

  return (
    <div className="space-y-6">
      <h1 className="font-voice text-2xl font-bold text-[var(--ink)]">Личные данные</h1>

      {/* Photo upload */}
      <div className="flex items-center gap-5 p-4 rounded-[var(--radius-1)] border border-[var(--rule)] bg-[var(--surface)]">
        {data.personal.photoUrl ? (
          <div className="relative group">
            <img
              src={data.personal.photoUrl}
              alt="Фото"
              className="w-16 h-16 rounded-full object-cover border border-[var(--rule-strong)]"
            />
            <button
              onClick={handleDeletePhoto}
              className="absolute -top-1 -right-1 p-1 bg-[var(--brick)] text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
              title="Удалить фото"
            >
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--rule-strong)] flex items-center justify-center text-[var(--ink-3)] shrink-0">
            <Upload size={20} strokeWidth={1.5} />
          </div>
        )}

        <div className="flex-1">
          <div className="text-sm font-medium text-[var(--ink)] mb-1">Фотография</div>
          <p className="text-xs text-[var(--ink-2)] mb-2">
            Рекомендуется нейтральный фон и портретный ракурс. До 5 МБ.
          </p>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--rule-strong)] rounded-[var(--radius-1)] cursor-pointer hover:bg-[var(--rule)]/20 transition-colors">
            <span>{data.personal.photoUrl ? 'Заменить фото' : 'Загрузить фото'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-xs font-medium tracking-wide text-[var(--ink-2)] mb-1.5">
          Имя и фамилия
        </label>
        <input
          type="text"
          value={data.personal.fullName}
          onChange={(e) => updateField('personal.fullName', e.target.value)}
          placeholder="Иван Петров"
          className="w-full h-11 px-3.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] hover:border-[var(--rule-strong)] transition-colors"
        />
      </div>

      {/* Target Position */}
      <div className="relative">
        <label className="block text-xs font-medium tracking-wide text-[var(--ink-2)] mb-1.5">
          Желаемая должность
        </label>
        <input
          type="text"
          value={data.personal.position}
          onChange={(e) => handlePositionChange(e.target.value)}
          placeholder="Frontend-разработчик"
          className="w-full h-11 px-3.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] hover:border-[var(--rule-strong)] transition-colors"
        />
        {positionSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] shadow-lg z-20 py-1">
            {positionSuggestions.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => {
                  updateField('personal.position', pos);
                  setPositionSuggestions([]);
                }}
                className="w-full text-left px-3.5 py-1.5 text-xs text-[var(--ink)] hover:bg-[var(--rule)]/20 transition-colors"
              >
                {pos}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* City */}
      <div>
        <label className="block text-xs font-medium tracking-wide text-[var(--ink-2)] mb-1.5">
          Город проживания
        </label>
        <input
          type="text"
          value={data.personal.city || ''}
          onChange={(e) => updateField('personal.city', e.target.value)}
          placeholder="Ташкент"
          className="w-full h-11 px-3.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] hover:border-[var(--rule-strong)] transition-colors"
        />
      </div>

      {/* Birth Date */}
      <div>
        <label className="block text-xs font-medium tracking-wide text-[var(--ink-2)] mb-1.5">
          Дата рождения
        </label>
        <input
          type="date"
          value={data.personal.birthDate || ''}
          onChange={(e) => updateField('personal.birthDate', e.target.value)}
          className="w-full h-11 px-3.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] hover:border-[var(--rule-strong)] transition-colors"
        />
      </div>

      {photoModalOpen && selectedImageSrc && (
        <PhotoCropModal
          imageSrc={selectedImageSrc}
          onClose={() => setPhotoModalOpen(false)}
          onSuccess={(url) => {
            updateField('personal.photoUrl', url);
          }}
        />
      )}
    </div>
  );
};
