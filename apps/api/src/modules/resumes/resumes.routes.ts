import { FastifyPluginAsync } from 'fastify';
import { dbStore } from '../../db/index.js';
import { Lang } from '@cvb/shared';

export const resumesRoutes: FastifyPluginAsync = async (fastify) => {
  // List
  fastify.get('/resumes', async (request) => {
    return dbStore.listResumes(request.session);
  });

  // Create
  fastify.post('/resumes', async (request, reply) => {
    const body = (request.body || {}) as { language?: Lang; id?: string };
    const resume = dbStore.createResume(body.id, request.session, body.language || 'ru');
    return reply.status(201).send({
      id: resume.id,
      version: resume.version,
      data: resume.data,
    });
  });

  // Get by ID
  fastify.get('/resumes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const resume = dbStore.getResume(id, request.session);
    if (!resume) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Резюме не найдено' },
      });
    }
    return {
      id: resume.id,
      version: resume.version,
      data: resume.data,
      photoUrl: resume.data.personal.photoUrl,
    };
  });

  // PATCH with optimistic locking
  fastify.patch('/resumes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { version: number; patch: any };

    if (body?.version === undefined || !body?.patch) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Укажите version и patch' },
      });
    }

    try {
      const result = dbStore.updateResume(id, body.version, body.patch, request.session);
      if (result.status === 'conflict') {
        return reply.status(409).send({
          error: {
            code: 'VERSION_CONFLICT',
            message: 'Данные были изменены на сервере',
          },
          version: result.version,
          data: result.data,
        });
      }
      return { version: result.version };
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Резюме не найдено' },
        });
      }
      if (err.message === 'FORBIDDEN') {
        return reply.status(403).send({
          error: { code: 'FORBIDDEN', message: 'Доступ запрещён' },
        });
      }
      return reply.status(500).send({
        error: { code: 'SERVER_ERROR', message: err.message },
      });
    }
  });

  // Duplicate
  fastify.post('/resumes/:id/duplicate', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const clone = dbStore.duplicateResume(id, request.session);
      return reply.status(201).send({ id: clone.id });
    } catch (err: any) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Резюме не найдено' },
      });
    }
  });

  // Delete
  fastify.delete('/resumes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = dbStore.deleteResume(id, request.session);
    if (!deleted) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Резюме не найдено' },
      });
    }
    return reply.status(204).send();
  });
};
