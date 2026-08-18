const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const master = await db.query('SELECT id, name, sms_enabled, smsru_api_key FROM masters WHERE id = $1', [req.masterId]);
    const global = await db.query('SELECT * FROM system_settings');
    const settings = {};
    global.rows.forEach(s => settings[s.key] = s.value);
    res.json({
      master: master.rows[0], sms_mode: settings.sms_mode || 'platform',
      smsru_platform_api_key: settings.smsru_platform_api_key || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', auth, async (req, res) => {
  const { sms_enabled, smsru_api_key } = req.body;
  try {
    await db.query('UPDATE masters SET sms_enabled = $1, smsru_api_key = $2 WHERE id = $3', [sms_enabled, smsru_api_key, req.masterId]);
    const result = await db.query('SELECT * FROM masters WHERE id = $1', [req.masterId]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;