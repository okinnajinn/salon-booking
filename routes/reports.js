const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { month } = req.query;
  try {
    const [year, mon] = month.split('-');
    const startDate = `${year}-${mon}-01`;
    const endDate = new Date(year, mon, 0).toISOString().split('T')[0];
    
    const total = await db.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(price_at_moment), 0) as earnings,
             COALESCE(AVG(price_at_moment), 0) as avg_check
      FROM appointments a
      JOIN time_slots ts ON a.slot_id = ts.id
      WHERE ts.date BETWEEN $1 AND $2 AND a.status = 'done'
    `, [startDate, endDate]);
    
    const byDay = await db.query(`
      SELECT ts.date, COUNT(*) as count, COALESCE(SUM(a.price_at_moment), 0) as earnings
      FROM appointments a
      JOIN time_slots ts ON a.slot_id = ts.id
      WHERE ts.date BETWEEN $1 AND $2 AND a.status = 'done'
      GROUP BY ts.date ORDER BY ts.date
    `, [startDate, endDate]);
    
    res.json({
      month, total_count: parseInt(total.rows[0].count),
      total_earnings: parseFloat(total.rows[0].earnings),
      average_check: parseFloat(total.rows[0].avg_check),
      breakdown_by_day: byDay.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;