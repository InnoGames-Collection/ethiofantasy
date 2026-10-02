import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  checkDailyChallengeEligibility,
  startDailyChallengeSession,
  recordAuthoritativeAnswer,
  completeAuthoritativeAttempt,
  getAuthoritativeTop10Leaderboard,
  normalizeMsisdn,
} from './src/services/authoritativeChallengeEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ======================================================================
// AUTHORITATIVE DAILY CHALLENGE COMPETITION REST API
// ======================================================================

/**
 * 1. Check Daily Challenge Status & Once-per-day restriction
 */
app.get('/api/daily-challenge/status', (req: Request, res: Response) => {
  const msisdn = (req.query.msisdn as string) || '251965112122';
  const result = checkDailyChallengeEligibility(msisdn);
  res.json(result);
});

/**
 * 2. Start or Resume Daily Challenge Session (Enforces 1 Attempt per Day)
 */
app.post('/api/daily-challenge/start', (req: Request, res: Response) => {
  const { msisdn } = req.body;
  if (!msisdn) {
    return res.status(400).json({ success: false, error: 'MSISDN is required' });
  }

  const result = startDailyChallengeSession(msisdn);
  if (!result.success) {
    return res.status(403).json(result);
  }

  res.json(result);
});

/**
 * 3. Server-Authoritative Answer Validation & Scoring (10s limit, 1 base + speed points)
 */
app.post('/api/daily-challenge/submit-answer', (req: Request, res: Response) => {
  const {
    msisdn,
    attemptId,
    questionId,
    questionStartTimestamp,
    answerTimestamp,
    selectedOptionIndex,
  } = req.body;

  if (!msisdn || !attemptId || !questionId || !questionStartTimestamp || !answerTimestamp) {
    return res.status(400).json({ success: false, error: 'Missing required answer fields' });
  }

  const result = recordAuthoritativeAnswer({
    rawMsisdn: msisdn,
    attemptId,
    questionId,
    questionStartTimestamp,
    answerTimestamp,
    selectedOptionIndex: selectedOptionIndex !== undefined ? selectedOptionIndex : null,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

/**
 * 4. Finalize Daily Challenge Attempt and Update 7-Day Total
 */
app.post('/api/daily-challenge/complete', (req: Request, res: Response) => {
  const { msisdn, attemptId } = req.body;
  if (!msisdn || !attemptId) {
    return res.status(400).json({ success: false, error: 'MSISDN and attemptId are required' });
  }

  const result = completeAuthoritativeAttempt({
    rawMsisdn: msisdn,
    attemptId,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

/**
 * 5. Public 7-Day Leaderboard (Masked MSISDN only, 5-tier deterministic tie-breaker)
 */
app.get('/api/leaderboard', (req: Request, res: Response) => {
  const msisdn = (req.query.msisdn as string) || '251965112122';
  const result = getAuthoritativeTop10Leaderboard(msisdn);
  res.json(result);
});

// ======================================================================
// DEV VITE MIDDLEWARE OR PRODUCTION STATIC SERVING
// ======================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`EthioFantasy Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
