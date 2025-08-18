import { Router } from "express";
import { query } from "../db.js";   // <-- use the shared pool with SSL set there

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM companies ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
