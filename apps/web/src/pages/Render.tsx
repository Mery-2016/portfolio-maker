import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ResumeData } from '@cvb/shared';
import { ResumeRenderer } from '@cvb/templates';

declare global {
  interface Window {
    __RENDER_READY__?: boolean;
  }
}

export const Render: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const format = (searchParams.get('format') || 'desktop') as 'desktop' | 'mobile';

  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (id) {
      fetch(`/api/v1/render-data/${id}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.data) {
            setResumeData(json.data);
            setPhotoUrl(json.photoUrl);
          }
        })
        .catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    if (resumeData) {
      if (document.fonts) {
        document.fonts.ready.then(() => {
          window.__RENDER_READY__ = true;
        });
      } else {
        window.__RENDER_READY__ = true;
      }
    }
  }, [resumeData]);

  if (!resumeData) return null;

  return (
    <div className="bg-white min-h-screen">
      <ResumeRenderer
        data={resumeData}
        format={format}
        photoUrl={photoUrl}
        scale={1}
      />
    </div>
  );
};
