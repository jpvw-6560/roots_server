// routes/debug.js
// Routes de debug pour tester la connexion MySQL

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Test de connexion basique
router.get('/test-connection', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DATABASE() as db_name');
    const [columns] = await pool.query('DESCRIBE persons');
    
    res.json({
      database: rows[0].db_name,
      persons_columns: columns.map(col => ({
        field: col.Field,
        type: col.Type,
        null: col.Null,
        key: col.Key
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// Test de requête avec id_parents
router.get('/test-query', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, prenom, id_parents 
      FROM persons 
      WHERE id_parents IS NOT NULL 
      LIMIT 3
    `);
    res.json({ success: true, rows });
  } catch (err) {
    res.status(500).json({ error: err.message, sql: err.sql });
  }
});

module.exports = router;
