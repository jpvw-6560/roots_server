// config/database.js
// Configuration de la base de données MySQL pour NeoGenea

const mysql = require('mysql2/promise');

// Configuration de la connexion
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'neogenea',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  dateStrings: true
});

/**
 * Initialise la base de données avec toutes les tables nécessaires
 */
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('🔄 Initialisation de la base de données...');
    
    // Table des personnes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS persons (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100),
        nom_jeune_fille VARCHAR(100),
        sexe ENUM('M', 'F', 'Autre') NOT NULL,
        date_naissance DATE,
        lieu_naissance VARCHAR(255),
        date_deces DATE,
        lieu_deces VARCHAR(255),
        biographie TEXT,
        photo_principale VARCHAR(255),
        vivant BOOLEAN DEFAULT TRUE,
        id_parents INT DEFAULT NULL,
        ordre_naissance INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nom (nom),
        INDEX idx_prenom (prenom),
        INDEX idx_date_naissance (date_naissance),
        INDEX idx_parents (id_parents)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Table des couples de parents
    await connection.query(`
      CREATE TABLE IF NOT EXISTS parents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        id_pere INT NOT NULL,
        id_mere INT NOT NULL,
        date_mariage DATE,
        lieu_mariage VARCHAR(255),
        date_divorce DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (id_pere) REFERENCES persons(id) ON DELETE CASCADE,
        FOREIGN KEY (id_mere) REFERENCES persons(id) ON DELETE CASCADE,
        INDEX idx_pere (id_pere),
        INDEX idx_mere (id_mere)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Ajouter la contrainte de clé étrangère pour id_parents si elle n'existe pas
    try {
      await connection.query(`
        ALTER TABLE persons 
        ADD CONSTRAINT fk_persons_parents 
        FOREIGN KEY (id_parents) REFERENCES parents(id) ON DELETE SET NULL
      `);
    } catch (err) {
      // La contrainte existe déjà, ignorer l'erreur
      if (err.code !== 'ER_DUP_KEYNAME') {
        console.warn('Note: Contrainte FK id_parents déjà présente ou erreur:', err.message);
      }
    }
    
    // Table des relations entre personnes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS relations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        person1_id INT NOT NULL,
        person2_id INT NOT NULL,
        type_relation ENUM('parent', 'enfant', 'conjoint', 'frere', 'soeur') NOT NULL,
        date_debut DATE,
        date_fin DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (person1_id) REFERENCES persons(id) ON DELETE CASCADE,
        FOREIGN KEY (person2_id) REFERENCES persons(id) ON DELETE CASCADE,
        INDEX idx_person1 (person1_id),
        INDEX idx_person2 (person2_id),
        INDEX idx_type (type_relation),
        UNIQUE KEY unique_relation (person1_id, person2_id, type_relation)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Table des médias
    await connection.query(`
      CREATE TABLE IF NOT EXISTS medias (
        id INT PRIMARY KEY AUTO_INCREMENT,
        person_id INT NOT NULL,
        type_media ENUM('photo', 'document', 'video', 'audio', 'acte') NOT NULL,
        chemin_fichier VARCHAR(255) NOT NULL,
        miniature VARCHAR(255),
        description TEXT,
        date_media DATE,
        taille_fichier INT,
        principale BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
        INDEX idx_person (person_id),
        INDEX idx_type (type_media),
        INDEX idx_principale (principale)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Table des familles (optionnel)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS familles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom_famille VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    connection.release();
    console.log('✅ Tables de la base de données vérifiées/créées');
    
  } catch (error) {
    console.error('❌ Erreur initialisation base de données:', error.message);
    throw error;
  }
}

/**
 * Teste la connexion à la base de données
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur connexion MySQL:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  initDatabase,
  testConnection
};
