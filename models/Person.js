// models/Person.js
// Modèle pour les personnes

const { pool } = require('../config/database');

class Person {
  /**
   * Récupère toutes les personnes
   */
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT p.*,
             m.chemin_fichier as photo,
             COUNT(DISTINCT r1.id) as nb_relations
      FROM persons p
      LEFT JOIN medias m ON p.id = m.person_id AND m.principale = TRUE AND m.type_media = 'photo'
      LEFT JOIN relations r1 ON p.id = r1.person1_id OR p.id = r1.person2_id
      GROUP BY p.id, m.chemin_fichier
      ORDER BY p.nom, p.prenom
    `);
    return rows;
  }
  
  /**
   * Récupère une personne par ID avec ses relations et médias
   */
  static async getById(id) {
    const [rows] = await pool.query('SELECT * FROM persons WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    
    const person = rows[0];
    
    // Récupérer les relations
    person.relations = await this.getRelations(id);
    
    // Récupérer les médias
    person.medias = await this.getMedias(id);
    
    return person;
  }
  
  /**
   * Récupère les relations d'une personne
   */
  static async getRelations(personId) {
    const [rows] = await pool.query(`
      SELECT r.*, 
             p1.nom as person1_nom, p1.prenom as person1_prenom,
             p2.nom as person2_nom, p2.prenom as person2_prenom
      FROM relations r
      JOIN persons p1 ON r.person1_id = p1.id
      JOIN persons p2 ON r.person2_id = p2.id
      WHERE r.person1_id = ? OR r.person2_id = ?
      ORDER BY r.type_relation, p2.nom
    `, [personId, personId]);
    return rows;
  }
  
  /**
   * Récupère les médias d'une personne
   */
  static async getMedias(personId) {
    const [rows] = await pool.query(`
      SELECT * FROM medias 
      WHERE person_id = ? 
      ORDER BY principale DESC, created_at DESC
    `, [personId]);
    return rows;
  }
  
  /**
   * Crée une nouvelle personne
   */
  static async create(personData) {
    const { nom, prenom, nom_jeune_fille, sexe, date_naissance, lieu_naissance, 
            date_deces, lieu_deces, biographie, vivant, id_parents } = personData;
    
    const [result] = await pool.query(`
      INSERT INTO persons (nom, prenom, nom_jeune_fille, sexe, date_naissance, 
                          lieu_naissance, date_deces, lieu_deces, biographie, vivant, id_parents)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [nom, prenom, nom_jeune_fille || null, sexe, date_naissance || null, 
        lieu_naissance || null, date_deces || null, lieu_deces || null, 
        biographie || null, vivant !== false, id_parents || null]);
    
    return result.insertId;
  }
  
  /**
   * Met à jour une personne
   */
  static async update(id, personData) {
    const { nom, prenom, nom_jeune_fille, sexe, date_naissance, lieu_naissance,
            date_deces, lieu_deces, biographie, vivant, id_parents } = personData;
    
    const [result] = await pool.query(`
      UPDATE persons 
      SET nom = ?, prenom = ?, nom_jeune_fille = ?, sexe = ?, 
          date_naissance = ?, lieu_naissance = ?, date_deces = ?, 
          lieu_deces = ?, biographie = ?, vivant = ?, id_parents = ?
      WHERE id = ?
    `, [nom, prenom, nom_jeune_fille || null, sexe, date_naissance || null,
        lieu_naissance || null, date_deces || null, lieu_deces || null,
        biographie || null, vivant !== false, id_parents || null, id]);
    
    return result.affectedRows > 0;
  }
  
  /**
   * Supprime une personne
   */
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM persons WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
  
  /**
   * Recherche des personnes
   */
  static async search(query) {
    const searchTerm = `%${query}%`;
    const [rows] = await pool.query(`
      SELECT p.*,
             m.chemin_fichier as photo
      FROM persons p
      LEFT JOIN medias m ON p.id = m.person_id AND m.principale = TRUE AND m.type_media = 'photo'
      WHERE p.nom LIKE ? OR p.prenom LIKE ? OR p.lieu_naissance LIKE ?
      ORDER BY p.nom, p.prenom
      LIMIT 50
    `, [searchTerm, searchTerm, searchTerm]);
    return rows;
  }
  
  /**
   * Récupère les parents d'une personne
   */
  static async getParents(personId) {
    const [rows] = await pool.query(`
      SELECT p.*, m.chemin_fichier as photo
      FROM relations r
      JOIN persons p ON r.person1_id = p.id
      LEFT JOIN medias m ON p.id = m.person_id AND m.principale = TRUE
      WHERE r.person2_id = ? AND r.type_relation = 'parent'
    `, [personId]);
    return rows;
  }
  
  /**
   * Récupère les enfants d'une personne
   */
  static async getChildren(personId) {
    const [rows] = await pool.query(`
      SELECT p.*, m.chemin_fichier as photo
      FROM relations r
      JOIN persons p ON r.person2_id = p.id
      LEFT JOIN medias m ON p.id = m.person_id AND m.principale = TRUE
      WHERE r.person1_id = ? AND r.type_relation = 'parent'
    `, [personId]);
    return rows;
  }
  
  /**
   * Récupère les conjoints d'une personne
   */
  static async getSpouses(personId) {
    const [rows] = await pool.query(`
      SELECT p.*, r.date_debut, r.date_fin, m.chemin_fichier as photo
      FROM relations r
      JOIN persons p ON (r.person1_id = p.id OR r.person2_id = p.id) AND p.id != ?
      LEFT JOIN medias m ON p.id = m.person_id AND m.principale = TRUE
      WHERE (r.person1_id = ? OR r.person2_id = ?) AND r.type_relation = 'conjoint'
    `, [personId, personId, personId]);
    return rows;
  }
}

module.exports = Person;
