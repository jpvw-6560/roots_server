const { pool } = require('../config/database');

/**
 * Modèle Union - Gère les unions entre personnes
 * Une union peut être un mariage, union libre ou PACS
 * Ce modèle remplace l'ancien système de relations "conjoint"
 */
class Union {
  /**
   * Récupérer toutes les unions
   */
  static async getAll() {
    try {
      const [rows] = await pool.query(`
        SELECT u.*, 
               p1.prenom as person1_prenom, p1.nom as person1_nom,
               p2.prenom as person2_prenom, p2.nom as person2_nom
        FROM unions u
        LEFT JOIN persons p1 ON u.person1_id = p1.id
        LEFT JOIN persons p2 ON u.person2_id = p2.id
        ORDER BY u.id
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer une union par son ID
   */
  static async getById(id) {
    try {
      const [rows] = await pool.query(`
        SELECT u.*, 
               p1.prenom as person1_prenom, p1.nom as person1_nom,
               p2.prenom as person2_prenom, p2.nom as person2_nom
        FROM unions u
        LEFT JOIN persons p1 ON u.person1_id = p1.id
        LEFT JOIN persons p2 ON u.person2_id = p2.id
        WHERE u.id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer toutes les unions d'une personne
   * @param {number} personId - ID de la personne
   * @returns {Array} Liste des unions
   */
  static async getByPersonId(personId) {
    try {
      const [rows] = await pool.query(`
        SELECT u.*, 
               p1.prenom as person1_prenom, p1.nom as person1_nom,
               p2.prenom as person2_prenom, p2.nom as person2_nom
        FROM unions u
        LEFT JOIN persons p1 ON u.person1_id = p1.id
        LEFT JOIN persons p2 ON u.person2_id = p2.id
        WHERE u.person1_id = ? OR u.person2_id = ?
        ORDER BY u.date_debut
      `, [personId, personId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer les enfants d'une union
   * @param {number} unionId - ID de l'union
   * @returns {Array} Liste des enfants
   */
  static async getChildren(unionId) {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, uc.ordre_naissance
        FROM union_children uc
        JOIN persons p ON uc.child_id = p.id
        WHERE uc.union_id = ?
        ORDER BY uc.ordre_naissance
      `, [unionId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Créer une nouvelle union
   * @param {Object} unionData - Données de l'union
   */
  static async create(unionData) {
    const { person1_id, person2_id, date_debut, date_fin, type_union } = unionData;
    
    try {
      const [result] = await pool.query(
        'INSERT INTO unions (person1_id, person2_id, date_debut, date_fin, type_union) VALUES (?, ?, ?, ?, ?)',
        [person1_id, person2_id, date_debut || null, date_fin || null, type_union || 'mariage']
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Ajouter un enfant à une union
   * @param {number} unionId - ID de l'union
   * @param {number} childId - ID de l'enfant
   * @param {number} ordreNaissance - Ordre de naissance (optionnel)
   */
  static async addChild(unionId, childId, ordreNaissance = null) {
    try {
      const [result] = await pool.query(
        'INSERT INTO union_children (union_id, child_id, ordre_naissance) VALUES (?, ?, ?)',
        [unionId, childId, ordreNaissance]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprimer un enfant d'une union
   * @param {number} unionId - ID de l'union
   * @param {number} childId - ID de l'enfant
   */
  static async removeChild(unionId, childId) {
    try {
      const [result] = await pool.query(
        'DELETE FROM union_children WHERE union_id = ? AND child_id = ?',
        [unionId, childId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mettre à jour une union
   */
  static async update(id, unionData) {
    const { person1_id, person2_id, date_debut, date_fin, type_union } = unionData;
    
    try {
      const [result] = await pool.query(
        'UPDATE unions SET person1_id = ?, person2_id = ?, date_debut = ?, date_fin = ?, type_union = ? WHERE id = ?',
        [person1_id, person2_id, date_debut || null, date_fin || null, type_union || 'mariage', id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Supprimer une union
   * Attention : supprime aussi les associations union_children (CASCADE)
   */
  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM unions WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupérer le conjoint d'une personne dans une union
   * @param {number} unionId - ID de l'union
   * @param {number} personId - ID de la personne
   * @returns {Object|null} Le conjoint ou null
   */
  static async getSpouse(unionId, personId) {
    try {
      const union = await this.getById(unionId);
      if (!union) return null;

      // Retourner le conjoint (l'autre personne de l'union)
      if (union.person1_id === personId) {
        return {
          id: union.person2_id,
          prenom: union.person2_prenom,
          nom: union.person2_nom
        };
      } else if (union.person2_id === personId) {
        return {
          id: union.person1_id,
          prenom: union.person1_prenom,
          nom: union.person1_nom
        };
      }
      return null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Union;
