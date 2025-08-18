import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.put('/:id', async (req, res) => {
  const { name, cost, status } = req.body;
  const { rows } = await query(
    'UPDATE scopes SET name=$1, cost=$2, status=$3 WHERE id=$4 RETURNING *',
    [name, cost, status, req.params.id]
  );
  if (!rows[0]) return res.sendStatus(404);
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM scopes WHERE id=$1', [req.params.id]);
  res.sendStatus(204);
});

export default router;