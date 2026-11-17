import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { dbStore, DbSession } from '../db/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    session: DbSession;
    sessionId: string;
  }
}

const sessionPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', async (request, reply) => {
    const rawSid = request.cookies.sid;
    const { session, token, isNew } = dbStore.getOrCreateSession(rawSid);

    if (isNew) {
      reply.setCookie('sid', token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 90 * 24 * 60 * 60, // 90 days
      });
    }

    request.session = session;
    request.sessionId = session.id;
  });
};

export default fp(sessionPlugin);
