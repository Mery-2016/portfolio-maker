import { FastifyPluginAsync } from 'fastify';
import { dbStore } from '../../db/index.js';

export const photosRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/resumes/:id/photo', async (request, reply) => {
    const { id } = request.params as { id: string };
    const resume = dbStore.getResume(id, request.session);
    if (!resume) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Резюме не найдено' },
      });
    }

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Файл не найден' },
      });
    }

    const buffer = await data.toBuffer();
    if (buffer.length > 5 * 1024 * 1024) {
      return reply.status(413).send({
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'Фото больше 5 МБ. Выберите файл поменьше' },
      });
    }

    // Save image
    const photoUrl = dbStore.savePhoto(id, buffer, 'webp');
    const photoKey = photoUrl.replace('/uploads/', '');

    // Update resume data
    dbStore.updateResume(
      id,
      resume.version,
      {
        personal: {
          ...resume.data.personal,
          photoKey,
          photoUrl,
        },
      },
      request.session
    );

    return { photoKey, photoUrl };
  });

  fastify.delete('/resumes/:id/photo', async (request, reply) => {
    const { id } = request.params as { id: string };
    const resume = dbStore.getResume(id, request.session);
    if (!resume) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Резюме не найдено' },
      });
    }

    dbStore.updateResume(
      id,
      resume.version,
      {
        personal: {
          ...resume.data.personal,
          photoKey: '',
          photoUrl: '',
        },
      },
      request.session
    );

    return reply.status(204).send();
  });
};
