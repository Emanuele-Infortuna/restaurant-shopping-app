// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware
app.use(cors());
app.use(express.json());

// Configurazione database
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurant_shopping',
  port: process.env.DB_PORT || 3306
};

// Pool di connessioni al database
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware per autenticazione
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token di accesso richiesto' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.execute(
      'SELECT id, username, role, name FROM users WHERE id = ?',
      [decoded.userId]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Utente non trovato' });
    }
    
    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token non valido' });
  }
};

// ROUTES

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password richiesti' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const user = rows[0];
    
    // Per ora confronto diretto (in produzione usa bcrypt)
    if (password !== getPlainPassword(user.username)) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Funzione helper per password (da sostituire con hash in produzione)
function getPlainPassword(username) {
  const passwords = {
    'admin': 'admin123',
    'mario': 'mario123',
    'lucia': 'lucia123'
  };
  return passwords[username];
}

// Ottenere articoli disponibili
app.get('/api/available-items', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM available_items ORDER BY name'
    );
    res.json(rows);
  } catch (error) {
    console.error('Errore nel recupero articoli:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Ottenere lista spesa
app.get('/api/shopping-list', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT sl.*, u.name as added_by_name 
      FROM shopping_list sl 
      JOIN users u ON sl.added_by_user_id = u.id 
      WHERE sl.is_purchased = FALSE 
      ORDER BY sl.created_at DESC
    `);
    
    const formattedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      addedBy: row.added_by_name,
      timestamp: new Date(row.created_at).toLocaleString('it-IT'),
      notes: row.notes,
      isPurchased: row.is_purchased
    }));
    
    res.json(formattedRows);
  } catch (error) {
    console.error('Errore nel recupero lista spesa:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Aggiungere articolo alla lista
app.post('/api/shopping-list', authenticateToken, async (req, res) => {
  try {
    const { name, quantity, notes = '' } = req.body;

    if (!name || !quantity) {
      return res.status(400).json({ error: 'Nome e quantità sono richiesti' });
    }

    const [result] = await pool.execute(
      'INSERT INTO shopping_list (name, quantity, added_by_user_id, notes) VALUES (?, ?, ?, ?)',
      [name.trim(), quantity.trim(), req.user.id, notes.trim()]
    );

    // Recupera l'articolo appena inserito
    const [rows] = await pool.execute(`
      SELECT sl.*, u.name as added_by_name 
      FROM shopping_list sl 
      JOIN users u ON sl.added_by_user_id = u.id 
      WHERE sl.id = ?
    `, [result.insertId]);

    const newItem = {
      id: rows[0].id,
      name: rows[0].name,
      quantity: rows[0].quantity,
      addedBy: rows[0].added_by_name,
      timestamp: new Date(rows[0].created_at).toLocaleString('it-IT'),
      notes: rows[0].notes,
      isPurchased: rows[0].is_purchased
    };

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Errore nell\'aggiunta articolo:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Rimuovere articolo dalla lista
app.delete('/api/shopping-list/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM shopping_list WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Articolo non trovato' });
    }

    res.json({ message: 'Articolo rimosso con successo' });
  } catch (error) {
    console.error('Errore nella rimozione articolo:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Marcare articolo come acquistato
app.patch('/api/shopping-list/:id/purchased', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPurchased } = req.body;

    const [result] = await pool.execute(
      'UPDATE shopping_list SET is_purchased = ? WHERE id = ?',
      [isPurchased, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Articolo non trovato' });
    }

    res.json({ message: 'Stato articolo aggiornato' });
  } catch (error) {
    console.error('Errore nell\'aggiornamento articolo:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Aggiungere nuovo articolo disponibile (solo admin)
app.post('/api/available-items', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato. Solo amministratori.' });
    }

    const { name, category = '' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome articolo richiesto' });
    }

    const [result] = await pool.execute(
      'INSERT INTO available_items (name, category) VALUES (?, ?)',
      [name.trim(), category.trim()]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM available_items WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Articolo già esistente' });
    }
    console.error('Errore nell\'aggiunta articolo disponibile:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Verifica connessione database
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'OK', database: 'connected' });
  } catch (error) {
    console.error('Errore connessione database:', error);
    res.status(500).json({ status: 'ERROR', database: 'disconnected' });
  }
});

// Gestione errori globale
app.use((error, req, res, next) => {
  console.error('Errore non gestito:', error);
  res.status(500).json({ error: 'Errore interno del server' });
});

// Avvio server
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;