// models/Relation.js
// Modèle pour les relations entre personnes

const { pool } = require('../config/database');

class Relation {
  /**
   * Récupère toutes les relations
   */
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT r.*, 
             p1.nom as person1_nom, p1.prenom as person1_prenom, p1.sexe as person1_sexe,
             p2.nom as person2_nom, p2.prenom as person2_prenom, p2.sexe as person2_sexe
      FROM relations r
      JOIN persons p1 ON r.person1_id = p1.id
      JOIN persons p2 ON r.person2_id = p2.id
      ORDER BY r.created_at DESC
    `);
    return rows;
  }
  
  /**
   * Récupère une relation par ID
   */
  static async getById(id) {
    const [rows] = await pool.query(`
      SELECT r.*, 
             p1.nom as person1_nom, p1.prenom as person1_prenom,
             p2.nom as person2_nom, p2.prenom as person2_prenom
      FROM relations r
      JOIN persons p1 ON r.person1_id = p1.id
      JOIN persons p2 ON r.person2_id = p2.id
      WHERE r.id = ?
    `, [id]);
    return rows.length > 0 ? rows[0] : null;
  }
  
  /**
   * Crée une nouvelle relation
   * Gère automatiquement la relation réciproque
   */
  static async create(relationData) {
    const { person1_id, person2_id, type_relation, date_debut, date_fin, notes } = relationData;
    
    try {
      // Insertion de la relation principale
      const [result] = await pool.query(`
        INSERT INTO relations (person1_id, person2_id, type_relation, date_debut, date_fin, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [person1_id, person2_id, type_relation, date_debut || null, date_fin || null, notes || null]);
      
      // Créer la relation réciproque selon le type
      const reciprocalType = this.getReciprocalType(type_relation);
      if (reciprocalType) {
        await pool.query(`
          INSERT INTO relations (person1_id, person2_id, type_relation, date_debut, date_fin, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [person2_id, person1_id, reciprocalType, date_debut || null, date_fin || null, notes || null]);
      }
      
      return result.insertId;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Cette relation existe déjà');
      }
      throw error;
    }
  }
  
  /**
   * Détermine le type de relation réciproque
   */
  static getReciprocalType(type) {
    const reciprocal = {
      'parent': 'enfant',
      'enfant': 'parent',
      'conjoint': 'conjoint',
      'frere': null, // Géré manuellement
      'soeur': null  // Géré manuellement
    };
    return reciprocal[type];
  }
  
  /**
   * Met à jour une relation
   */
  static async update(id, relationData) {
    const { type_relation, date_debut, date_fin, notes } = relationData;
    
    const [result] = await pool.query(`
      UPDATE relations 
      SET type_relation = ?, date_debut = ?, date_fin = ?, notes = ?
      WHERE id = ?
    `, [type_relation, date_debut || null, date_fin || null, notes || null, id]);
    
    return result.affectedRows > 0;
  }
  
  /**
   * Supprime une relation et sa relation réciproque
   */
  static async delete(id) {
    // Récupérer les informations de la relation
    const [relation] = await pool.query('SELECT * FROM relations WHERE id = ?', [id]);
    if (relation.length === 0) return false;
    
    const { person1_id, person2_id, type_relation } = relation[0];
    
    // Supprimer la relation principale
    await pool.query('DELETE FROM relations WHERE id = ?', [id]);
    
    // Supprimer la relation réciproque
    const reciprocalType = this.getReciprocalType(type_relation);
    if (reciprocalType) {
      await pool.query(`
        DELETE FROM relations 
        WHERE person1_id = ? AND person2_id = ? AND type_relation = ?
      `, [person2_id, person1_id, reciprocalType]);
    }
    
    return true;
  }
  
  /**
   * Récupère toutes les relations d'une personne
   */
  static async getByPerson(personId) {
    const [rows] = await pool.query(`
      SELECT r.*, 
             CASE 
               WHEN r.person1_id = ? THEN p2.id
               ELSE p1.id
             END as related_person_id,
             CASE 
               WHEN r.person1_id = ? THEN CONCAT(p2.prenom, ' ', p2.nom)
               ELSE CONCAT(p1.prenom, ' ', p1.nom)
             END as related_person_name
      FROM relations r
      JOIN persons p1 ON r.person1_id = p1.id
      JOIN persons p2 ON r.person2_id = p2.id
      WHERE r.person1_id = ? OR r.person2_id = ?
    `, [personId, personId, personId, personId]);
    return rows;
  }
}

module.exports = Relation;
