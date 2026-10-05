import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function proxyToBackend(apiBaseUrl: string) {
  const parsedTarget = new URL(apiBaseUrl);

  return (req: Request, res: Response) => {
    const targetUrl = new URL(req.originalUrl, apiBaseUrl);

    const headers = { ...req.headers };
    headers.host = parsedTarget.host;

    const proxyReq = http.request(
      targetUrl,
      {
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', (err) => {
      console.error('[Web Proxy Error]', err.message);
      if (!res.headersSent) {
        res.status(502).json({
          error: 'BAD_GATEWAY',
          message: 'Fastify API backend unavailable',
          detail: err.message,
        });
      }
    });

    req.pipe(proxyReq);
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3400;
  const API_URL = process.env.API_URL || 'http://localhost:3402';
  const isProd = process.env.NODE_ENV === 'production';

  // Health check endpoint for Docker / GCP probes
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'EthioFantasy Player Web Gateway',
      backendTarget: API_URL,
      time: new Date().toISOString(),
    });
  });

  // Pure reverse proxy for all /api/* requests to authoritative Fastify API
  app.use('/api', proxyToBackend(API_URL));

  // Static files from public
  app.use(express.static(path.join(__dirname, 'public')));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[EthioFantasy Web] Server running on http://0.0.0.0:${PORT} -> Proxying API to ${API_URL}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
