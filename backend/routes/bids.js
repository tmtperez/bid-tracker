// backend/routes/bids.js
import express from 'express';
import { query } from '../db.js';

const router = express.Router();
const ALLOWED_STATUS = new Set(['active', 'won', 'lost', 'pending']);

function coerceNumber(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

router.get('/', async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const page = Math.max(1, parseInt(req.query.page ?? '1', 10) || 1);
    const pageSize = Math.min(500, Math.max(1, parseInt(req.query.pageSize ?? '100', 10) || 100));
    const offset = (page - 1) * pageSize;

    const where = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(`(b.project ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const dataSql = `
      SELECT
        b.id, b.company_id, b.project, b.date_sent, b.last_contact,
        b.status, b.value, b.created_at,
        c.name AS company_name
      FROM public.bids AS b
      LEFT JOIN public.companies AS c ON c.id = b.company_id
      ${whereSQL}
      ORDER BY b.created_at DESC, b.id DESC
      LIMIT $${params.length + 1}::int
      OFFSET $${params.length + 2}::int
    `;

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM public.bids AS b
      LEFT JOIN public.companies AS c ON c.id = b.company_id
      ${whereSQL}
    `;

    const [dataRes, countRes] = await Promise.all([
      query(dataSql, [...params, pageSize, offset]),
      query(countSql, params),
    ]);

    res.json({
      data: dataRes.rows,
      page,
      pageSize,
      total: countRes.rows[0]?.total ?? 0,
    });
  } catch (err) {
    console.error('GET /api/bids failed:', err);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.sendStatus(400);

    const bidRes = await query(
      `SELECT b.*, c.name AS company_name
       FROM public.bids b
       LEFT JOIN public.companies c ON c.id = b.company_id
       WHERE b.id = $1`,
      [id]
    );
    if (!bidRes.rows[0]) return res.sendStatus(404);

    const scopesRes = await query(
      'SELECT * FROM public.scopes WHERE bid_id=$1 ORDER BY id',
      [id]
    );

    res.json({ ...bidRes.rows[0], scopes: scopesRes.rows });
  } catch (err) {
    console.error('GET /bids/:id failed:', err);
    res.status(500).json({ error: 'Failed to fetch bid' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      company_id,
      project,
      date_sent = null,
      last_contact = null,
      status = 'active',
      value = 0,
    } = req.body || {};

    if (!project || typeof project !== 'string') {
      return res.status(400).json({ error: 'Project is required' });
    }
    if (!ALLOWED_STATUS.has(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${[...ALLOWED_STATUS].join(', ')}` });
    }

    const valueNum = coerceNumber(value, 0);

    const insertRes = await query(
      `INSERT INTO public.bids (company_id, project, date_sent, last_contact, status, value)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [company_id || null, project, date_sent || null, last_contact || null, status, valueNum]
    );

    const bid = insertRes.rows[0];
    const companyNameRes = await query('SELECT name FROM public.companies WHERE id=$1', [bid.company_id]);
    res.status(201).json({ ...bid, company_name: companyNameRes.rows[0]?.name || null });
  } catch (err) {
    console.error('POST /bids failed:', err);
    res.status(500).json({ error: 'Failed to create bid' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.sendStatus(400);

    const {
      company_id,
      project,
      date_sent = null,
      last_contact = null,
      status,
      value,
    } = req.body || {};

    if (status && !ALLOWED_STATUS.has(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${[...ALLOWED_STATUS].join(', ')}` });
    }

    const valueNum = value === undefined ? undefined : coerceNumber(value, 0);

    const fields = [];
    const params = [];
    const add = (sqlFrag, v) => {
      params.push(v);
      fields.push(sqlFrag.replace('?', `$${params.length}`));
    };

    if (company_id !== undefined) add('company_id=?', company_id || null);
    if (project !== undefined) add('project=?', project);
    if (date_sent !== undefined) add('date_sent=?', date_sent || null);
    if (last_contact !== undefined) add('last_contact=?', last_contact || null);
    if (status !== undefined) add('status=?', status);
    if (value !== undefined) add('value=?', valueNum);

    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(id);
    const sql = `UPDATE public.bids SET ${fields.join(', ')} WHERE id=$${params.length} RETURNING *`;
    const { rows } = await query(sql, params);
    if (!rows[0]) return res.sendStatus(404);

    const companyNameRes = await query('SELECT name FROM public.companies WHERE id=$1', [rows[0].company_id]);
    res.json({ ...rows[0], company_name: companyNameRes.rows[0]?.name || null });
  } catch (err) {
    console.error('PUT /bids/:id failed:', err);
    res.status(500).json({ error: 'Failed to update bid' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.sendStatus(400);
    await query('DELETE FROM public.bids WHERE id=$1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('DELETE /bids/:id failed:', err);
    res.status(500).json({ error: 'Failed to delete bid' });
  }
});

router.get('/:id/scopes', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.sendStatus(400);
    const { rows } = await query(
      'SELECT * FROM public.scopes WHERE bid_id=$1 ORDER BY id',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /bids/:id/scopes failed:', err);
    res.status(500).json({ error: 'Failed to fetch scopes' });
  }
});

router.post('/:id/scopes', async (req, res) => {
  try {
    const bidId = Number(req.params.id);
    if (!Number.isFinite(bidId)) return res.sendStatus(400);

    const { name, cost = 0, status = 'open' } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Scope name is required' });

    const costNum = coerceNumber(cost, 0);

    const { rows } = await query(
      `INSERT INTO public.scopes (bid_id, name, cost, status)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [bidId, name, costNum, status]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /bids/:id/scopes failed:', err);
    res.status(500).json({ error: 'Failed to create scope' });
  }
});

export default router;
