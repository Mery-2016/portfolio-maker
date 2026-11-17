import { FastifyPluginAsync } from 'fastify';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/session', async (request, reply) => {
    return {
      userId: request.session.userId,
      isAnonymous: !request.session.userId,
      sessionId: request.session.id,
    };
  });

  fastify.post('/auth/email/request', async (request, reply) => {
    const body = request.body as { email?: string };
    if (!body?.email) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Укажите email' },
      });
    }
    // Mock code send
    return reply.status(204).send();
  });

  fastify.post('/auth/email/verify', async (request, reply) => {
    const body = request.body as { email?: string; code?: string };
    if (!body?.email || !body?.code) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Укажите email и код' },
      });
    }

    const userId = 'usr_' + Buffer.from(body.email).toString('hex').slice(0, 12);
    request.session.userId = userId;

    return { userId };
  });

  fastify.post('/auth/logout', async (request, reply) => {
    reply.clearCookie('sid', { path: '/' });
    return reply.status(204).send();
  });
};
