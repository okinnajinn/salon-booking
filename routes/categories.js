const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY sort_order');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { name, icon, image, sort_order } = req.body;
  try {
    const id = randomUUID();
    await db.query('INSERT INTO categories (id, name, icon, sort_order) VALUES ($1,$2,$3,$4)', [id, name, icon || '', sort_order || 0]);
    const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const services = await db.query('SELECT COUNT(*) as c FROM services WHERE category_id = $1', [req.params.id]);
    if (services.rows[0].c > 0) return res.status(400).json({ error: 'Сначала удалите услуги из категории' });
    await db.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;