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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Configurazione database
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurant_shopping',
  port: process.env.DB_PORT || 3306
};

// Pool di connessioni al database (configurazione corretta)
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Rimosse le opzioni non supportate: acquireTimeout e timeout
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connessione database all'avvio
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connesso al database MySQL');
    connection.release();
  } catch (error) {
    console.error('❌ Errore connessione database:', error.message);
    console.error('💡 Assicurati che MySQL sia in esecuzione e le credenziali siano corrette');
    process.exit(1);
  }
})();

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
    console.error('Errore autenticazione:', error);
    return res.status(403).json({ error: 'Token non valido' });
  }
};

// ROUTES

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ 
      status: 'OK', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Errore health check:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'disconnected',
      error: error.message
    });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password richiesti' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const user = rows[0];
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
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

// Verifica token (per mantenere la sessione)
app.get('/api/verify', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      name: req.user.name
    }
  });
});

// Ottenere articoli disponibili
app.get('/api/available-items', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM available_items ORDER BY category, name'
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
      SELECT 
        sl.id,
        sl.name,
        sl.quantity,
        sl.notes,
        sl.is_purchased,
        sl.created_at,
        sl.updated_at,
        u.name as added_by_name 
      FROM shopping_list sl 
      JOIN users u ON sl.added_by_user_id = u.id 
      ORDER BY sl.is_purchased ASC, sl.created_at DESC
    `);
    
    const formattedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      addedBy: row.added_by_name,
      timestamp: new Date(row.created_at).toLocaleString('it-IT'),
      notes: row.notes || '',
      isPurchased: Boolean(row.is_purchased)
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

    // Verifica se l'articolo esiste già nella lista (non acquistato)
    const [existing] = await pool.execute(
      'SELECT id FROM shopping_list WHERE name = ? AND is_purchased = FALSE',
      [name.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Articolo già presente nella lista' });
    }

    const [result] = await pool.execute(
      'INSERT INTO shopping_list (name, quantity, added_by_user_id, notes) VALUES (?, ?, ?, ?)',
      [name.trim(), quantity.trim(), req.user.id, notes.trim()]
    );

    // Recupera l'articolo appena inserito
    const [rows] = await pool.execute(`
      SELECT 
        sl.id,
        sl.name,
        sl.quantity,
        sl.notes,
        sl.is_purchased,
        sl.created_at,
        u.name as added_by_name 
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
      notes: rows[0].notes || '',
      isPurchased: Boolean(rows[0].is_purchased)
    };

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Errore nell\'aggiunta articolo:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Articolo già presente nella lista' });
    }
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

// Marcare articolo come acquistato/non acquistato
app.patch('/api/shopping-list/:id/purchased', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isPurchased } = req.body;

    if (typeof isPurchased !== 'boolean') {
      return res.status(400).json({ error: 'isPurchased deve essere un valore booleano' });
    }

    const [result] = await pool.execute(
      'UPDATE shopping_list SET is_purchased = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [isPurchased, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Articolo non trovato' });
    }

    res.json({ 
      message: isPurchased ? 'Articolo marcato come acquistato' : 'Articolo rimesso in lista',
      isPurchased 
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento articolo:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Aggiungere nuovo articolo disponibile (solo admin)
app.post('/api/available-items', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato. Solo amministratori possono aggiungere articoli.' });
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
    console.error('Errore nell\'aggiunta articolo disponibile:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Articolo già esistente' });
    }
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Gestione errori globale
app.use((error, req, res, next) => {
  console.error('Errore non gestito:', error);
  res.status(500).json({ error: 'Errore interno del server' });
});

// Gestione route non trovate
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

// Funzione per trovare una porta libera
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer();
    server.listen(startPort, (err) => {
      if (err) {
        server.close();
        if (err.code === 'EADDRINUSE') {
          findAvailablePort(startPort + 1).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      } else {
        const port = server.address().port;
        server.close();
        resolve(port);
      }
    });
  });
};

// Avvio server con gestione porta occupata
(async () => {
  try {
    let serverPort = PORT;
    
    // Se la porta è occupata, trova una porta libera
    try {
      await findAvailablePort(PORT);
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️  Porta ${PORT} occupata, cercando porta libera...`);
        serverPort = await findAvailablePort(PORT + 1);
        console.log(`✅ Trovata porta libera: ${serverPort}`);
      }
    }
    
    app.listen(serverPort, () => {
      console.log(`🚀 Server in esecuzione sulla porta ${serverPort}`);
      console.log(`📊 Health check: http://localhost:${serverPort}/api/health`);
      console.log(`🌐 CORS abilitato per: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      
      if (serverPort !== PORT) {
        console.log(`💡 Aggiorna il frontend per usare la porta ${serverPort}`);
      }
    });
  } catch (error) {
    console.error('❌ Errore nell\'avvio del server:', error);
    process.exit(1);
  }
})();

// Gestione chiusura graceful
process.on('SIGTERM', async () => {
  console.log('🔄 Chiusura server in corso...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Chiusura server in corso...');
  await pool.end();
  process.exit(0);
});

module.exports = app;