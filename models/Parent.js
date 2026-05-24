const { pool } = require('../config/database');

class Parent {
  /**
   * Créer un nouveau couple de parents
   */
  static async create(parentData) {
    const { id_pere, id_mere, date_mariage, lieu_mariage, date_divorce } = parentData;
    
    const query = `
      INSERT INTO parents (id_pere, id_mere, date_mariage, lieu_mariage, date_divorce)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      id_pere,
      id_mere,
      date_mariage || null,
      lieu_mariage || null,
      date_divorce || null
    ]);
    
    return result.insertId;
  }

  /**
   * Récupérer tous les couples de parents
   */
  static async findAll() {
    const query = `
      SELECT 
        p.*,
        pere.prenom as pere_prenom,
        pere.nom as pere_nom,
        mere.prenom as mere_prenom,
        mere.nom as mere_nom
      FROM parents p
      LEFT JOIN persons pere ON p.id_pere = pere.id
      LEFT JOIN persons mere ON p.id_mere = mere.id
      ORDER BY p.id
    `;
    
    const [rows] = await pool.query(query);
    return rows;
  }

  /**
   * Récupérer un couple de parents par ID
   */
  static async findById(id) {
    const query = `
      SELECT 
        p.*,
        pere.prenom as pere_prenom,
        pere.nom as pere_nom,
        mere.prenom as mere_prenom,
        mere.nom as mere_nom
      FROM parents p
      LEFT JOIN persons pere ON p.id_pere = pere.id
      LEFT JOIN persons mere ON p.id_mere = mere.id
      WHERE p.id = ?
    `;
    
    const [rows] = await pool.query(query, [id]);
    return rows[0];
  }

  /**
   * Trouver les parents d'une personne
   */
  static async findByChildId(childId) {
    const query = `
      SELECT 
        p.*,
        pere.prenom as pere_prenom,
        pere.nom as pere_nom,
        pere.sexe as pere_sexe,
        mere.prenom as mere_prenom,
        mere.nom as mere_nom,
        mere.sexe as mere_sexe
      FROM persons child
      INNER JOIN parents p ON child.id_parents = p.id
      LEFT JOIN persons pere ON p.id_pere = pere.id
      LEFT JOIN persons mere ON p.id_mere = mere.id
      WHERE child.id = ?
    `;
    
    const [rows] = await pool.query(query, [childId]);
    return rows[0];
  }

  /**
   * Récupérer les enfants d'un couple de parents
   */
  static async findChildren(parentId) {
    const query = `
      SELECT * FROM persons
      WHERE id_parents = ?
      ORDER BY date_naissance, ordre_naissance
    `;
    
    const [rows] = await pool.query(query, [parentId]);
    return rows;
  }

  /**
   * Récupérer tous les couples de parents avec leurs enfants
   */
  static async findAllWithChildren() {
    const query = `
      SELECT 
        p.id as parent_id,
        p.id_pere,
        p.id_mere,
        p.date_mariage,
        p.lieu_mariage,
        p.date_divorce,
        pere.prenom as pere_prenom,
        pere.nom as pere_nom,
        pere.sexe as pere_sexe,
        mere.prenom as mere_prenom,
        mere.nom as mere_nom,
        mere.sexe as mere_sexe,
        child.id as child_id,
        child.prenom as child_prenom,
        child.nom as child_nom,
        child.sexe as child_sexe,
        child.date_naissance as child_date_naissance
      FROM parents p
      LEFT JOIN persons pere ON p.id_pere = pere.id
      LEFT JOIN persons mere ON p.id_mere = mere.id
      LEFT JOIN persons child ON child.id_parents = p.id
      ORDER BY p.id, child.date_naissance
    `;
    
    const [rows] = await pool.query(query);
    
    // Regrouper par couple de parents
    const parentsMap = new Map();
    
    rows.forEach(row => {
      if (!parentsMap.has(row.parent_id)) {
        parentsMap.set(row.parent_id, {
          id: row.parent_id,
          id_pere: row.id_pere,
          id_mere: row.id_mere,
          date_mariage: row.date_mariage,
          lieu_mariage: row.lieu_mariage,
          date_divorce: row.date_divorce,
          pere: {
            id: row.id_pere,
            prenom: row.pere_prenom,
            nom: row.pere_nom,
            sexe: row.pere_sexe
          },
          mere: {
            id: row.id_mere,
            prenom: row.mere_prenom,
            nom: row.mere_nom,
            sexe: row.mere_sexe
          },
          children: []
        });
      }
      
      if (row.child_id) {
        parentsMap.get(row.parent_id).children.push({
          id: row.child_id,
          prenom: row.child_prenom,
          nom: row.child_nom,
          sexe: row.child_sexe,
          date_naissance: row.child_date_naissance
        });
      }
    });
    
    return Array.from(parentsMap.values());
  }

  /**
   * Mettre à jour un couple de parents
   */
  static async update(id, parentData) {
    const { id_pere, id_mere, date_mariage, lieu_mariage, date_divorce } = parentData;
    
    const query = `
      UPDATE parents
      SET id_pere = ?,
          id_mere = ?,
          date_mariage = ?,
          lieu_mariage = ?,
          date_divorce = ?
      WHERE id = ?
    `;
    
    const [result] = await pool.query(query, [
      id_pere,
      id_mere,
      date_mariage || null,
      lieu_mariage || null,
      date_divorce || null,
      id
    ]);
    
    return result.affectedRows > 0;
  }

  /**
   * Supprimer un couple de parents
   */
  static async delete(id) {
    // Note: les enfants auront leur id_parents mis à NULL grâce à ON DELETE SET NULL
    const query = 'DELETE FROM parents WHERE id = ?';
    const [result] = await pool.query(query, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Trouver ou créer un couple de parents
   */
  static async findOrCreate(id_pere, id_mere, additionalData = {}) {
    // Chercher si ce couple existe déjà
    const query = `
      SELECT id FROM parents
      WHERE id_pere = ? AND id_mere = ?
    `;
    
    const [rows] = await pool.query(query, [id_pere, id_mere]);
    
    if (rows.length > 0) {
      return rows[0].id;
    }
    
    // Créer le couple
    return await this.create({
      id_pere,
      id_mere,
      ...additionalData
    });
  }
}

module.exports = Parent;
