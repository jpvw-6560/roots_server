// models/Media.js
// Modèle pour les médias (photos, documents, etc.)

const { pool } = require('../config/database');

class Media {
  /**
   * Récupère tous les médias
   */
  static async getAll() {
    const [rows] = await pool.query(`
      SELECT m.*, 
             p.nom as person_nom, 
             p.prenom as person_prenom
      FROM medias m
      JOIN persons p ON m.person_id = p.id
      ORDER BY m.created_at DESC
    `);
    return rows;
  }
  
  /**
   * Récupère un média par ID
   */
  static async getById(id) {
    const [rows] = await pool.query(`
      SELECT m.*, 
             p.nom as person_nom, 
             p.prenom as person_prenom
      FROM medias m
      JOIN persons p ON m.person_id = p.id
      WHERE m.id = ?
    `, [id]);
    return rows.length > 0 ? rows[0] : null;
  }
  
  /**
   * Récupère les médias d'une personne
   */
  static async getByPerson(personId) {
    const [rows] = await pool.query(`
      SELECT * FROM medias 
      WHERE person_id = ? 
      ORDER BY principale DESC, created_at DESC
    `, [personId]);
    return rows;
  }
  
  /**
   * Crée un nouveau média
   */
  static async create(mediaData) {
    const { person_id, type_media, chemin_fichier, miniature, description, 
            date_media, taille_fichier, principale } = mediaData;
    
    // Si c'est une photo principale, retirer le flag des autres photos
    if (principale && type_media === 'photo') {
      await pool.query(`
        UPDATE medias 
        SET principale = FALSE 
        WHERE person_id = ? AND type_media = 'photo'
      `, [person_id]);
    }
    
    const [result] = await pool.query(`
      INSERT INTO medias (person_id, type_media, chemin_fichier, miniature, 
                         description, date_media, taille_fichier, principale)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [person_id, type_media, chemin_fichier, miniature || null, 
        description || null, date_media || null, taille_fichier || null, 
        principale || false]);
    
    // Si c'est une photo principale, mettre à jour la personne
    if (principale && type_media === 'photo') {
      await pool.query(`
        UPDATE persons 
        SET photo_principale = ? 
        WHERE id = ?
      `, [chemin_fichier, person_id]);
    }
    
    return result.insertId;
  }
  
  /**
   * Met à jour un média
   */
  static async update(id, mediaData) {
    const { type_media, description, date_media, principale } = mediaData;
    
    // Récupérer les infos actuelles
    const media = await this.getById(id);
    if (!media) return false;
    
    // Si on définit comme photo principale
    if (principale && type_media === 'photo') {
      await pool.query(`
        UPDATE medias 
        SET principale = FALSE 
        WHERE person_id = ? AND type_media = 'photo'
      `, [media.person_id]);
      
      await pool.query(`
        UPDATE persons 
        SET photo_principale = ? 
        WHERE id = ?
      `, [media.chemin_fichier, media.person_id]);
    }
    
    const [result] = await pool.query(`
      UPDATE medias 
      SET type_media = ?, description = ?, date_media = ?, principale = ?
      WHERE id = ?
    `, [type_media, description || null, date_media || null, principale || false, id]);
    
    return result.affectedRows > 0;
  }
  
  /**
   * Supprime un média
   */
  static async delete(id) {
    // Récupérer les infos avant suppression
    const media = await this.getById(id);
    if (!media) return false;
    
    // Si c'était la photo principale, la retirer de la personne
    if (media.principale && media.type_media === 'photo') {
      await pool.query(`
        UPDATE persons 
        SET photo_principale = NULL 
        WHERE id = ?
      `, [media.person_id]);
    }
    
    const [result] = await pool.query('DELETE FROM medias WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
  
  /**
   * Définit un média comme photo principale
   */
  static async setAsPrincipal(id) {
    const media = await this.getById(id);
    if (!media || media.type_media !== 'photo') return false;
    
    // Retirer le flag des autres photos
    await pool.query(`
      UPDATE medias 
      SET principale = FALSE 
      WHERE person_id = ? AND type_media = 'photo'
    `, [media.person_id]);
    
    // Définir cette photo comme principale
    await pool.query(`
      UPDATE medias 
      SET principale = TRUE 
      WHERE id = ?
    `, [id]);
    
    // Mettre à jour la personne
    await pool.query(`
      UPDATE persons 
      SET photo_principale = ? 
      WHERE id = ?
    `, [media.chemin_fichier, media.person_id]);
    
    return true;
  }
}

module.exports = Media;
