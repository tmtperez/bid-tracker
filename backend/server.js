// server.js
import express from 'express';
import cors from 'cors';
import { pool, query } from './db.js';
import bids from './routes/bids.js';
import companies from './routes/companies.js';
import scopes from './routes/scopes.js';


const app = express();
const PORT = process.env.PORT || 8080;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN, credentials: false }));
app.use(express.json());

// Keep both for convenience (DO often routes the backend at /api/*)
app.get('/api/health', async (_req, res) => {
  try {
    const r = await query('select 1 as ok;');
    res.json({ ok: true, db: r.rows[0].ok === 1 });
  } catch (e) {
    console.error('[health] DB error:', e.code, e.message);
    res.status(500).json({ ok: false, code: e.code, error: e.message });
  }
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// If ingress sends everything under /api, strip it before route mounts
app.use((req, _res, next) => {
  if (req.url.startsWith('/api/')) req.url = req.url.slice(4);
  else if (req.url === '/api') req.url = '/';
  next();
});

app.get('/', (_req, res) => res.json({ ok: true, service: 'bid-tracker-api' }));

app.use('/bids', bids);
app.use('/companies', companies);
app.use('/scopes', scopes);

// Basic error handler
app.use((err, _req, res, _next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ ok: false, error: 'Internal Server Error' });
});

const server = app.listen(PORT, () => console.log(`API listening on :${PORT}`));

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server…');
  server.close(async () => {
    try { await pool.end(); } catch {}
    process.exit(0);
  });
});
