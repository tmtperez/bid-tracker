import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import bids from './routes/bids.js';
import companies from './routes/companies.js';
import scopes from './routes/scopes.js';

const app = express();
const PORT = process.env.PORT || 8080;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const db = require('./db');

app.use(cors({ origin: CORS_ORIGIN, credentials: false }));
app.use(express.json());

// If your DO ingress routes backend at /api/*, make the server tolerant of it.
app.use((req, _res, next) => {
  if (req.url.startsWith('/api/')) req.url = req.url.slice(4); // "/api/bids" -> "/bids"
  else if (req.url === '/api') req.url = '/';
  next();
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/dashboard', async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM v_dashboard');
  const d = rows[0] || { active_pipeline_value: 0, total_won: 0, count_won: 0, count_lost: 0 };
  const winLossRatio = d.count_lost === 0 ? (d.count_won > 0 ? 1 : 0) : Number(d.count_won) / Number(d.count_lost);
  res.json({ ...d, win_loss_ratio: winLossRatio });
});

app.use('/bids', bids);
app.use('/companies', companies);
app.use('/scopes', scopes);

app.listen(PORT, () => console.log(`API listening on :${PORT}`));
