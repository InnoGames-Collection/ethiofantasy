import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3400;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ethiofantasy-web', version: '1.0.0' });
});

// Proxy /api requests to authoritative Fastify backend
const API_URL = process.env.API_URL || 'http://api:3402';
app.all('/api*', async (req, res) => {
  try {
    const targetUrl = `${API_URL}${req.originalUrl}`;
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
      fetchOptions.headers['content-type'] = 'application/json';
    }

    const apiRes = await fetch(targetUrl, fetchOptions);
    res.status(apiRes.status);
    apiRes.headers.forEach((val, key) => {
      if (key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, val);
      }
    });
    const buffer = await apiRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(502).json({ error: 'Authoritative Fastify API unavailable', detail: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 EthioFantasy Web Client running on port ${PORT}`);
});
