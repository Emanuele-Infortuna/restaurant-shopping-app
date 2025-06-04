const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function initializeDatabase() {
  let connection;
  
  try {
    console.log('🔄 Inizializzazione database in corso...');

    // Connessione senza specificare il database per crearlo
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connesso al server MySQL');

    const dbName = process.env.DB_NAME || 'restaurant_shopping';

    // Crea database se non esiste
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database \`${dbName}\` creato o già esistente`);

    // Chiudi la connessione e riapri specificando il database
    await connection.end();
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      port: process.env.DB_PORT || 3306
    });

    console.log(`✅ Connesso al database \`${dbName}\``);

    // Crea tabella utenti
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'employee') DEFAULT 'employee' NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabella users creata');

    // Crea tabella articoli disponibili
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS available_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_name (name),
        INDEX idx_category (category),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabella available_items creata');

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
        FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (added_by_user_id),
        INDEX idx_created (created_at),
        INDEX idx_purchased (is_purchased),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabella shopping_list creata');

    // Hash delle password con salt più sicuro
    const saltRounds = 12;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const marioPassword = await bcrypt.hash('mario123', saltRounds);
    const luciaPassword = await bcrypt.hash('lucia123', saltRounds);

    // Inserisci utenti di default (se non esistono)
    const users = [
      ['admin', adminPassword, 'admin', 'Amministratore'],
      ['mario', marioPassword, 'employee', 'Mario Rossi'],
      ['lucia', luciaPassword, 'employee', 'Lucia Bianchi']
    ];

    for (const [username, password, role, name] of users) {
      try {
        await connection.execute(
          'INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP',
          [username, password, role, name]
        );
        console.log(`✅ Utente ${username} creato/aggiornato`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`ℹ️  Utente ${username} già esistente`);
        } else {
          throw error;
        }
      }
    }

    // Inserisci articoli predefiniti
    const items = [
      ['Pomodori', 'verdure'],
      ['Mozzarella', 'latticini'],
      ['Basilico', 'erbe'],
      ['Olio d\'oliva', 'condimenti'],
      ['Pasta', 'cereali'],
      ['Spaghetti', 'cereali'],
      ['Penne', 'cereali'],
      ['Riso', 'cereali'],
      ['Carne di manzo', 'proteine'],
      ['Pollo', 'proteine'],
      ['Pesce', 'proteine'],
      ['Salmone', 'proteine'],
      ['Verdure miste', 'verdure'],
      ['Insalata', 'verdure'],
      ['Carote', 'verdure'],
      ['Cipolle', 'verdure'],
      ['Aglio', 'verdure'],
      ['Patate', 'verdure'],
      ['Pane', 'cereali'],
      ['Burro', 'latticini'],
      ['Latte', 'latticini'],
      ['Uova', 'proteine'],
      ['Parmigiano', 'latticini'],
      ['Prosciutto', 'salumi'],
      ['Salame', 'salumi'],
      ['Sale', 'condimenti'],
      ['Pepe', 'condimenti'],
      ['Origano', 'erbe'],
      ['Rosmarino', 'erbe'],
      ['Prezzemolo', 'erbe']
    ];

    // Pulisci e reinserisci articoli
    await connection.execute('DELETE FROM available_items');
    console.log('🔄 Tabella available_items svuotata');
    
    for (const [name, category] of items) {
      try {
        await connection.execute(
          'INSERT INTO available_items (name, category) VALUES (?, ?)',
          [name, category]
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          throw error;
        }
      }
    }
    console.log(`✅ ${items.length} articoli predefiniti inseriti`);

    // Pulisci la lista spesa esistente
    await connection.execute('DELETE FROM shopping_list');
    console.log('🔄 Lista spesa svuotata');

    console.log('\n🎉 Database inizializzato con successo!');
    console.log('\n👥 Credenziali di accesso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Admin:      admin     / admin123');
    console.log('👤 Dipendente: mario     / mario123');
    console.log('👤 Dipendente: lucia     / lucia123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n🌐 Server URL: http://localhost:${process.env.PORT || 3001}`);
    console.log(`📊 Health check: http://localhost:${process.env.PORT || 3001}/api/health`);

  } catch (error) {
    console.error('❌ Errore nell\'inizializzazione del database:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connessione database chiusa');
    }
  }
}

// Esegui inizializzazione solo se chiamato direttamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;