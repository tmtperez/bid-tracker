// backend/routes/companies.js
import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM public.companies ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
