import type { IncomingMessage, ServerResponse } from 'http';
import { server } from '../apps/api/dist/server.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const matchedPath = (req.headers['x-matched-path'] || req.headers['x-now-route-matches']) as string | undefined;
  if (matchedPath && (req.url === '/api' || req.url?.startsWith('/api?'))) {
    req.url = matchedPath;
  }
  await server.ready();
  server.server.emit('request', req, res);
}
