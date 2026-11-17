import { ResumeData } from '@cvb/shared';

export interface TemplateProps {
  data: ResumeData;
  format: 'desktop' | 'mobile';
  photoUrl?: string;
}
