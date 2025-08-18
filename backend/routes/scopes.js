// backend/routes/scopes.js
import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.sendStatus(400);

    const { name, cost, status } = req.body || {};
    if (!name || status == null) return res.status(400).json({ error: 'name and status are required' });

    const costNum = Number.isFinite(Number(cost)) ? Number(cost) : 0;

    const { rows } = await query(
      'UPDATE public.scopes SET name=$1, cost=$2, status=$3 WHERE id=$4 RETURNING *',
      [name, costNum, status, id]
    );
    if (!rows[0]) return res.sendStatus(404);
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /scopes/:id failed:', err);
    res.status(500).json({ error: 'Failed to update scope' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.sendStatus(400);
    await query('DELETE FROM public.scopes WHERE id=$1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('DELETE /scopes/:id failed:', err);
    res.status(500).json({ error: 'Failed to delete scope' });
  }
});

export default router;
