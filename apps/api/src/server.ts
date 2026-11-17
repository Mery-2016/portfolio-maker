import 'dotenv/config';
import fs from 'fs';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import sessionPlugin from './plugins/session.js';
import { resumesRoutes } from './modules/resumes/resumes.routes.js';
import { photosRoutes } from './modules/photos/photos.routes.js';
import { aiRoutes } from './modules/ai/ai.routes.js';
import { exportRoutes } from './modules/export/export.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';

const server = Fastify({
  logger: {
    level: 'info',
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          remoteAddress: req.ip,
        };
      },
    },
  },
});

// Register CORS
await server.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
});

// Register cookies
await server.register(cookie, {
  secret: process.env.SESSION_SECRET || 'cvb-session-secret-key-1234567890',
});

// Register multipart for photos
await server.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});

// Static directories for uploads and exports
const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/data' : path.resolve(process.cwd(), 'data'));
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const EXPORTS_DIR = path.join(DATA_DIR, 'exports');
try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });
} catch {
  // Ignored in read-only filesystems
}

await server.register(fastifyStatic, {
  root: UPLOADS_DIR,
  prefix: '/uploads/',
  decorateReply: false,
});

await server.register(fastifyStatic, {
  root: EXPORTS_DIR,
  prefix: '/exports/',
  decorateReply: false,
});

// Session plugin
await server.register(sessionPlugin);

// Register API routes under /api/v1
server.register(async (api) => {
  await api.register(authRoutes);
  await api.register(resumesRoutes);
  await api.register(photosRoutes);
  await api.register(aiRoutes);
  await api.register(exportRoutes);
}, { prefix: '/api/v1' });

// Healthcheck
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Global error handler (SPEC §3.1)
server.setErrorHandler((error: any, request, reply) => {
  request.log.error(error);
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    error: {
      code: (error as any).code || 'SERVER_ERROR',
      message: error.message || 'Внутренняя ошибка сервера',
    },
  });
});

if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  const PORT = Number(process.env.PORT || 3001);
  const HOST = process.env.HOST || '0.0.0.0';

  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`CV Builder AI API Server running at http://localhost:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

export { server };
export default server;
