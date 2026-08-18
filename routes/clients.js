const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', async (req, res) => {
  const { name, phone } = req.body;
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 11) return res.status(400).json({ error: 'Телефон должен быть 11 цифр' });
  
  try {
    const existing = await db.query('SELECT * FROM clients WHERE phone = $1', [cleanPhone]);
    if (existing.rows[0]) return res.json({ ...existing.rows[0], existing: true });
    
    const id = randomUUID();
    await db.query('INSERT INTO clients (id, name, phone) VALUES ($1, $2, $3)', [id, name, cleanPhone]);
    const result = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
    res.json({ ...result.rows[0], existing: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  const { search } = req.query;
  try {
    let result;
    if (search) {
      result = await db.query(`
        SELECT * FROM clients WHERE LOWER(name) LIKE LOWER($1) OR phone LIKE $1 ORDER BY created_at DESC
      `, [`%${search}%`]);
    } else {
      result = await db.query('SELECT * FROM clients ORDER BY created_at DESC LIMIT 50');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const client = await db.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (!client.rows[0]) return res.status(404).json({ error: 'Клиент не найден' });
    
    const history = await db.query(`
      SELECT a.id, a.price_at_moment, a.status, a.created_at,
             s.name as service_name, ts.date, ts.start_time
      FROM appointments a
      JOIN services s ON a.service_id = s.id
      JOIN time_slots ts ON a.slot_id = ts.id
      WHERE a.client_id = $1 ORDER BY ts.date DESC, ts.start_time DESC
    `, [req.params.id]);
    
    res.json({ ...client.rows[0], history: history.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/notes', auth, async (req, res) => {
  const { notes } = req.body;
  try {
    await db.query('UPDATE clients SET notes = $1 WHERE id = $2', [notes, req.params.id]);
    const result = await db.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;