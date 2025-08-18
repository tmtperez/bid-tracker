import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { rows } = await query(`
    SELECT b.*, c.name AS company_name
    FROM bids b LEFT JOIN companies c ON b.company_id = c.id
    ORDER BY b.created_at DESC
  `);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await query('SELECT * FROM bids WHERE id=$1', [req.params.id]);
  if (!rows[0]) return res.sendStatus(404);
  const bid = rows[0];
  const scopes = (await query('SELECT * FROM scopes WHERE bid_id=$1 ORDER BY id', [bid.id])).rows;
  res.json({ ...bid, scopes });
});

router.post('/', async (req, res) => {
  const { company_id, project, date_sent, last_contact, status, value } = req.body;
  const { rows } = await query(
    `INSERT INTO bids (company_id, project, date_sent, last_contact, status, value)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [company_id || null, project, date_sent || null, last_contact || null, status || 'active', value || 0]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', async (req, res) => {
  const { company_id, project, date_sent, last_contact, status, value } = req.body;
  const { rows } = await query(
    `UPDATE bids SET company_id=$1, project=$2, date_sent=$3, last_contact=$4, status=$5, value=$6
     WHERE id=$7 RETURNING *`,
    [company_id || null, project, date_sent || null, last_contact || null, status, value, req.params.id]
  );
  if (!rows[0]) return res.sendStatus(404);
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM bids WHERE id=$1', [req.params.id]);
  res.sendStatus(204);
});

router.get('/:id/scopes', async (req, res) => {
  const { rows } = await query('SELECT * FROM scopes WHERE bid_id=$1 ORDER BY id', [req.params.id]);
  res.json(rows);
});

router.post('/:id/scopes', async (req, res) => {
  const { name, cost, status } = req.body;
  const { rows } = await query(
    `INSERT INTO scopes (bid_id, name, cost, status)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.id, name, cost || 0, status || 'open']
  );
  res.status(201).json(rows[0]);
});

export default router;