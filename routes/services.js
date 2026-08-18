const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'services');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.id as cat_id, c.name as cat_name, c.icon,
             s.id, s.name, s.short_description, s.duration_min, s.price, s.images, s.sort_order, s.is_active
      FROM categories c
      LEFT JOIN services s ON s.category_id = c.id
      ORDER BY c.sort_order, s.sort_order
    `);
    const categories = {};
    result.rows.forEach(row => {
      if (!categories[row.cat_id]) {
        categories[row.cat_id] = { id: row.cat_id, name: row.cat_name, icon: row.icon, services: [] };
      }
      if (row.id) {
        categories[row.cat_id].services.push({
          id: row.id, name: row.name, short_description: row.short_description,
          duration_min: row.duration_min, price: row.price,
          images: JSON.parse(row.images || '[]'), is_active: row.is_active
        });
      }
    });
    res.json(Object.values(categories));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM services WHERE id = $1 AND is_active = 1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Услуга не найдена' });
    const row = result.rows[0];
    row.images = JSON.parse(row.images || '[]');
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { category_id, name, short_description, full_description, purpose, duration_min, price, sort_order } = req.body;
  const catId = category_id || null;
  try {
    const id = randomUUID();
    await db.query(`
      INSERT INTO services (id, category_id, name, short_description, full_description, purpose, duration_min, price, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [id, catId, name, short_description, full_description, purpose, duration_min, price, sort_order || 0]);
    const result = await db.query('SELECT * FROM services WHERE id = $1', [id]);
    const row = result.rows[0];
    row.images = JSON.parse(row.images || '[]');
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { name, short_description, full_description, purpose, duration_min, price, category_id, sort_order } = req.body;
  const catId = category_id || null;
  try {
    await db.query(`
      UPDATE services SET name=$1, short_description=$2, full_description=$3, purpose=$4,
      duration_min=$5, price=$6, category_id=$7, sort_order=$8, updated_at=datetime('now') WHERE id=$9
    `, [name, short_description, full_description, purpose, duration_min, price, catId, sort_order, req.params.id]);
    const result = await db.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    row.images = JSON.parse(row.images || '[]');
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/toggle', auth, async (req, res) => {
  try {
    await db.query('UPDATE services SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = $1', [req.params.id]);
    const result = await db.query('SELECT * FROM services WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    row.images = JSON.parse(row.images || '[]');
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const apps = await db.query('SELECT COUNT(*) as c FROM appointments WHERE service_id = $1', [req.params.id]);
    if (apps.rows[0].c > 0) return res.status(400).json({ error: 'Нельзя удалить: есть записи в истории' });
    await db.query('DELETE FROM services WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Загрузить фото к услуге
router.post('/:id/images', auth, upload.array('images', 5), async (req, res) => {
  try {
    const service = await db.query('SELECT images FROM services WHERE id = $1', [req.params.id]);
    const existing = JSON.parse(service.rows[0]?.images || '[]');
    const newImages = req.files.map(f => '/uploads/services/' + f.filename);
    const all = [...existing, ...newImages].slice(0, 5); // макс 5 фото
    
    await db.query("UPDATE services SET images = $1 WHERE id = $2", [JSON.stringify(all), req.params.id]);
    res.json({ images: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить фото по индексу
router.delete('/:id/images/:index', auth, async (req, res) => {
  try {
    const service = await db.query('SELECT images FROM services WHERE id = $1', [req.params.id]);
    const images = JSON.parse(service.rows[0]?.images || '[]');
    const idx = parseInt(req.params.index);
    
    if (images[idx]) {
      const filePath = path.join(__dirname, '..', images[idx]);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      images.splice(idx, 1);
    }
    
    await db.query("UPDATE services SET images = $1 WHERE id = $2", [JSON.stringify(images), req.params.id]);
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;