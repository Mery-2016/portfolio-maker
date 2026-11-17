import { FastifyPluginAsync } from 'fastify';
import fs from 'fs';
import path from 'path';
import { dbStore } from '../../db/index.js';
import { getResumeFileName } from '@cvb/shared';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const EXPORTS_DIR = path.resolve(process.cwd(), 'data', 'exports');

export const exportRoutes: FastifyPluginAsync = async (fastify) => {
  // Request export
  fastify.post('/resumes/:id/export', async (request, reply) => {
    const { id } = request.params as { id: string };
    const resume = dbStore.getResume(id, request.session);
    if (!resume) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } });
    }

    const body = (request.body || {}) as { format?: 'pdf-desktop' | 'pdf-mobile' | 'png-mobile' };
    const format = body.format || 'pdf-desktop';

    const exp = dbStore.createExport(id, format);
    const fileName = getResumeFileName(
      resume.data.personal.fullName || 'Candidate',
      resume.data.personal.position || 'Resume',
      format
    );

    // Asynchronously generate export file
    setTimeout(async () => {
      try {
        dbStore.updateExport(exp.id, { status: 'processing' });

        // Generate clean PDF with pdf-lib
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const isMobile = format === 'pdf-mobile';
        const page = isMobile
          ? pdfDoc.addPage([390, 844])
          : pdfDoc.addPage([595.28, 841.89]); // A4 in points (72 dpi)

        const { width, height } = page.getSize();
        const margin = isMobile ? 24 : 48;
        let y = height - margin;

        // Title
        const fullName = resume.data.personal.fullName || 'Candidate Name';
        page.drawText(fullName, {
          x: margin,
          y,
          size: 20,
          font: fontBold,
          color: rgb(0.07, 0.09, 0.15),
        });
        y -= 24;

        // Position
        const position = resume.data.personal.position || 'Target Position';
        page.drawText(position, {
          x: margin,
          y,
          size: 13,
          font: fontBold,
          color: rgb(0.07, 0.38, 0.54), // Samarkand lazur
        });
        y -= 20;

        // Contacts
        const contacts = [resume.data.contacts.email, resume.data.contacts.phone].filter(Boolean).join('  |  ');
        if (contacts) {
          page.drawText(contacts, {
            x: margin,
            y,
            size: 10,
            font,
            color: rgb(0.33, 0.35, 0.37),
          });
          y -= 24;
        }

        // Horizontal line
        page.drawLine({
          start: { x: margin, y },
          end: { x: width - margin, y },
          thickness: 1,
          color: rgb(0.87, 0.85, 0.82),
        });
        y -= 24;

        // Summary
        if (resume.data.ai.summary) {
          page.drawText('SUMMARY', {
            x: margin,
            y,
            size: 10,
            font: fontBold,
            color: rgb(0.07, 0.38, 0.54),
          });
          y -= 16;

          const summaryLines = resume.data.ai.summary.split('\n');
          for (const line of summaryLines) {
            page.drawText(line.slice(0, 80), {
              x: margin,
              y,
              size: 9.5,
              font,
              color: rgb(0.1, 0.1, 0.1),
            });
            y -= 14;
          }
          y -= 12;
        }

        // Experience
        if (resume.data.experience.length > 0) {
          page.drawText('EXPERIENCE', {
            x: margin,
            y,
            size: 10,
            font: fontBold,
            color: rgb(0.07, 0.38, 0.54),
          });
          y -= 16;

          for (const expItem of resume.data.experience) {
            page.drawText(`${expItem.role} - ${expItem.company}`, {
              x: margin,
              y,
              size: 10,
              font: fontBold,
              color: rgb(0.1, 0.1, 0.1),
            });
            y -= 14;

            const bullets = expItem.aiBullets && expItem.aiBullets.length > 0
              ? expItem.aiBullets
              : [expItem.rawDescription];

            for (const b of bullets.slice(0, 4)) {
              page.drawText(`*  ${b.slice(0, 85)}`, {
                x: margin + 10,
                y,
                size: 9,
                font,
                color: rgb(0.2, 0.2, 0.2),
              });
              y -= 13;
            }
            y -= 8;
          }
        }

        const pdfBytes = await pdfDoc.save();
        const filePath = path.join(EXPORTS_DIR, `${exp.id}.pdf`);
        fs.writeFileSync(filePath, pdfBytes);

        dbStore.updateExport(exp.id, {
          status: 'done',
          url: `/exports/${exp.id}.pdf`,
          fileName,
          sizeBytes: pdfBytes.length,
          durationMs: 850,
        });
      } catch (err: any) {
        dbStore.updateExport(exp.id, {
          status: 'failed',
          error: err.message,
        });
      }
    }, 400);

    return reply.status(202).send({ exportId: exp.id });
  });

  // Check export status
  fastify.get('/exports/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const exp = dbStore.getExport(id);
    if (!exp) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Экспорт не найден' } });
    }
    return {
      status: exp.status,
      url: exp.url,
      fileName: exp.fileName,
      error: exp.error,
    };
  });

  // Render route data for Puppeteer
  fastify.get('/render-data/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const resume = dbStore.getResume(id, request.session);
    if (!resume) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } });
    }
    return {
      data: resume.data,
      photoUrl: resume.data.personal.photoUrl,
    };
  });
};
