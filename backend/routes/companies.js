import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM companies ORDER BY name');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  const { rows } = await query('INSERT INTO companies (name) VALUES ($1) RETURNING *', [name]);
  res.status(201).json(rows[0]);
});

export default router;