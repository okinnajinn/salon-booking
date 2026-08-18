const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Укажите date' });
  try {
    const result = await db.query(`SELECT * FROM time_slots WHERE date = $1 AND status = 'free' ORDER BY start_time`, [date]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/week', auth, async (req, res) => {
  const { from, to } = req.query;
  try {
    const result = await db.query(`
      SELECT ts.*, a.id as app_id, a.client_id, a.status as app_status, c.name as client_name,
             s.name as service_name
      FROM time_slots ts
      LEFT JOIN appointments a ON a.slot_id = ts.id AND a.status != 'cancelled'
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE ts.date BETWEEN $1 AND $2
      ORDER BY ts.date, ts.start_time
    `, [from, to]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/generate', auth, async (req, res) => {
  const { date_from, days_of_week, time_from, time_to, step_min } = req.body;
  try {
    const startDate = new Date(date_from);
    const slots = [];
    for (let i = 0; i < 14; i++) {
      const current = new Date(startDate);
      current.setDate(current.getDate() + i);
      const dayOfWeek = current.getDay() || 7;
      if (!days_of_week.includes(dayOfWeek)) continue;
      let [h, m] = time_from.split(':').map(Number);
      const [endH, endM] = time_to.split(':').map(Number);
      while (h < endH || (h === endH && m < endM)) {
        const startTime = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
        const totalMin = h * 60 + m + step_min;
        const endH2 = Math.floor(totalMin / 60);
        const endM2 = totalMin % 60;
        const endTime = `${String(endH2).padStart(2,'0')}:${String(endM2).padStart(2,'0')}`;
        slots.push([randomUUID(), current.toISOString().split('T')[0], startTime, endTime]);
        m += step_min;
        if (m >= 60) { h += Math.floor(m/60); m = m % 60; }
      }
    }
    for (const slot of slots) {
      await db.query(`INSERT INTO time_slots (id, date, start_time, end_time) VALUES ($1, $2, $3, $4) ON CONFLICT(date, start_time) DO NOTHING`, slot);
    }
    res.json({ created: slots.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/block', auth, async (req, res) => {
  try {
    await db.query("UPDATE time_slots SET status = 'blocked' WHERE id = $1", [req.params.id]);
    const result = await db.query('SELECT * FROM time_slots WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/unblock', auth, async (req, res) => {
  try {
    await db.query("UPDATE time_slots SET status = 'free' WHERE id = $1 AND status = 'blocked'", [req.params.id]);
    const result = await db.query('SELECT * FROM time_slots WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;