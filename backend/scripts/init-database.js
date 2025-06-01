// scripts/init-database.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function initializeDatabase() {
  let connection;
  
  try {
    // Connessione senza specificare il database per crearlo
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('Connesso al server MySQL');

    // Crea database se non esiste
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'restaurant_shopping'}`);
    console.log(`Database ${process.env.DB_NAME || 'restaurant_shopping'} creato o già esistente`);

    // Chiudi la connessione e riapri specificando il database
    await connection.end();
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'restaurant_shopping',
      port: process.env.DB_PORT || 3306
    });

    console.log(`Connesso al database ${process.env.DB_NAME || 'restaurant_shopping'}`);

    // Crea tabella utenti
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'employee') NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabella users creata');

    // Crea tabella articoli disponibili
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS available_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabella available_items creata');

    // Crea tabella lista spesa
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shopping_list (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        quantity VARCHAR(50) NOT NULL,
        added_by_user_id INT NOT NULL,
        is_purchased BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabella shopping_list creata');

    // Hash delle password
    const adminPassword = await bcrypt.hash('admin123', 10);
    const marioPassword = await bcrypt.hash('mario123', 10);
    const luciaPassword = await bcrypt.hash('lucia123', 10);

    // Inserisci utenti di default (se non esistono)
    const users = [
      ['admin', adminPassword, 'admin', 'Amministratore'],
      ['mario', marioPassword, 'employee', 'Mario Rossi'],
      ['lucia', luciaPassword, 'employee', 'Lucia Bianchi']
    ];

    for (const [username, password, role, name] of users) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO users (username, password, role, name) VALUES (?, ?, ?, ?)',
          [username, password, role, name]
        );
        console.log(`Utente ${username} creato`);
      } catch (error) {
        console.log(`Utente ${username} già esistente`);
      }
    }

    // Inserisci articoli predefiniti
    const items = [
      ['Pomodori', 'verdure'],
      ['Mozzarella', 'latticini'],
      ['Basilico', 'erbe'],
      ['Olio d\'oliva', 'condimenti'],
      ['Pasta', 'cereali'],
      ['Carne', 'proteine'],
      ['Pesce', 'proteine'],
      ['Verdure', 'verdure'],
      ['Pane', 'cereali'],
      ['Burro', 'latticini'],
      ['Latte', 'latticini'],
      ['Uova', 'proteine'],
      ['Formaggio', 'latticini'],
      ['Prosciutto', 'salumi']
    ];

    // Svuota e reinserisci articoli
    await connection.execute('DELETE FROM available_items');
    
    for (const [name, category] of items) {
      await connection.execute(
        'INSERT INTO available_items (name, category) VALUES (?, ?)',
        [name, category]
      );
    }
    console.log('Articoli predefiniti inseriti');

    // Crea indici
    try {
      await connection.execute('CREATE INDEX idx_shopping_list_user ON shopping_list(added_by_user_id)');
      await connection.execute('CREATE INDEX idx_shopping_list_created ON shopping_list(created_at)');
      await connection.execute('CREATE INDEX idx_users_username ON users(username)');
      console.log('Indici creati');
    } catch (error) {
      console.log('Indici già esistenti o errore nella creazione');
    }

    console.log('\n✅ Database inizializzato con successo!');
    console.log('\nCredenziali di accesso:');
    console.log('Admin: admin / admin123');
    console.log('Dipendente: mario / mario123');
    console.log('Dipendente: lucia / lucia123');

  } catch (error) {
    console.error('❌ Errore nell\'inizializzazione del database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Esegui inizializzazione
initializeDatabase();