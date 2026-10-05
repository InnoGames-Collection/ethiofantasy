import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function proxyToBackend(apiBaseUrl: string) {
  const parsedTarget = new URL(apiBaseUrl);

  return (req: express.Request, res: express.Response) => {
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
      console.error('[Admin Proxy Error]', err.message);
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
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3403;
  const API_URL = process.env.API_URL || 'http://localhost:3402';
  const isProd = process.env.NODE_ENV === 'production';

  // Health check endpoint for Docker / GCP probes
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'EthioFantasy Admin Operations Gateway',
      backendTarget: API_URL,
      time: new Date().toISOString(),
    });
  });

  // Pure reverse proxy for /api/* forwarded directly to Fastify API
  app.use('/api', proxyToBackend(API_URL));

  if (!isProd) {
    // Development mode with Vite dev middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EthioFantasy Admin Portal] Server running on http://0.0.0.0:${PORT} -> Proxying API to ${API_URL}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
