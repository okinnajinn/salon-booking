const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { login, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM masters WHERE login = $1', [login]);
    const master = result.rows[0];
    if (!master) return res.status(401).json({ error: 'Неверный логин или пароль' });
    
    const valid = await bcrypt.compare(password, master.password_hash);
    if (!valid) return res.status(401).json({ error: 'Неверный логин или пароль' });
    
    const token = jwt.sign({ masterId: master.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, master: { id: master.id, name: master.name, login: master.login } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const result = await db.query('SELECT * FROM masters WHERE id = $1', [req.masterId]);
    const master = result.rows[0];
    const valid = await bcrypt.compare(oldPassword, master.password_hash);
    if (!valid) return res.status(400).json({ error: 'Старый пароль неверный' });
    
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE masters SET password_hash = $1 WHERE id = $2', [hash, req.masterId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;