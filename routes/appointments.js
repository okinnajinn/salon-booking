const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', async (req, res) => {
  const { client_id, service_id, slot_id, name, phone } = req.body;
  try {
    let finalClientId = client_id;
    if (!finalClientId && phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const existing = await db.query('SELECT id FROM clients WHERE phone = $1', [cleanPhone]);
      if (existing.rows[0]) {
        finalClientId = existing.rows[0].id;
        if (name) await db.query('UPDATE clients SET name = $1 WHERE id = $2', [name, finalClientId]);
      } else {
        const newId = randomUUID();
        await db.query('INSERT INTO clients (id, name, phone) VALUES ($1, $2, $3)', [newId, name, cleanPhone]);
        finalClientId = newId;
      }
    }
    const slotCheck = await db.query("SELECT * FROM time_slots WHERE id = $1", [slot_id]);
    if (!slotCheck.rows[0]) return res.status(404).json({ error: 'Слот не найден' });
    if (slotCheck.rows[0].status !== 'free') return res.status(409).json({ error: 'Слот уже занят' });
    await db.query("UPDATE time_slots SET status = 'occupied' WHERE id = $1", [slot_id]);
    const service = await db.query('SELECT price FROM services WHERE id = $1', [service_id]);
    const priceAtMoment = service.rows[0]?.price || 0;
    const appId = randomUUID();
    await db.query(`INSERT INTO appointments (id, client_id, service_id, slot_id, price_at_moment) VALUES ($1, $2, $3, $4, $5)`, [appId, finalClientId, service_id, slot_id, priceAtMoment]);
    const appointment = await db.query('SELECT * FROM appointments WHERE id = $1', [appId]);
    res.json(appointment.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/my', async (req, res) => {
  const { phone } = req.body;
  const clean = phone?.replace(/\D/g, '');
  if (!clean || clean.length !== 11) return res.status(400).json({ error: 'Телефон 11 цифр' });
  try {
    const result = await db.query(`
      SELECT a.*, s.name as service_name, ts.date, ts.start_time, ts.end_time
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      JOIN time_slots ts ON a.slot_id = ts.id
      WHERE c.phone = $1 AND a.status != 'cancelled'
      ORDER BY ts.date DESC, ts.start_time DESC
    `, [clean]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  const { from, to } = req.query;
  try {
    let sql = `
      SELECT a.*, c.name as client_name, c.phone, s.name as service_name, ts.date, ts.start_time, ts.end_time
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      JOIN time_slots ts ON a.slot_id = ts.id
    `;
    const params = [];
    if (from && to) { sql += ' WHERE ts.date BETWEEN $1 AND $2'; params.push(from, to); }
    sql += ' ORDER BY ts.date, ts.start_time';
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const app = await db.query('SELECT slot_id FROM appointments WHERE id = $1', [req.params.id]);
    if (app.rows[0]) await db.query("UPDATE time_slots SET status = 'free' WHERE id = $1", [app.rows[0].slot_id]);
    await db.query("UPDATE appointments SET status = 'cancelled' WHERE id = $1", [req.params.id]);
    const result = await db.query('SELECT * FROM appointments WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/complete', auth, async (req, res) => {
  try {
    await db.query("UPDATE appointments SET status = 'done' WHERE id = $1", [req.params.id]);
    const result = await db.query('SELECT * FROM appointments WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;