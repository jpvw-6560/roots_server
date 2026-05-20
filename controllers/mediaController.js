// controllers/mediaController.js
// Contrôleur pour la gestion des médias

const Media = require('../models/Media');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config/config');

// Configuration de multer pour l'upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = config.uploadDir;
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allTypes = Object.values(config.mediaTypes).flat();
    
    if (allTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});

/**
 * Récupère tous les médias
 */
exports.getAllMedias = async (req, res) => {
  try {
    const medias = await Media.getAll();
    res.json(medias);
  } catch (error) {
    console.error('Erreur getAllMedias:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des médias' });
  }
};

/**
 * Récupère un média par ID
 */
exports.getMediaById = async (req, res) => {
  try {
    const media = await Media.getById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Média non trouvé' });
    }
    res.json(media);
  } catch (error) {
    console.error('Erreur getMediaById:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du média' });
  }
};

/**
 * Récupère les médias d'une personne
 */
exports.getMediasByPerson = async (req, res) => {
  try {
    const medias = await Media.getByPerson(req.params.personId);
    res.json(medias);
  } catch (error) {
    console.error('Erreur getMediasByPerson:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des médias' });
  }
};

/**
 * Upload d'un média
 */
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }
    
    const { person_id, type_media, description, date_media, principale } = req.body;
    
    if (!person_id || !type_media) {
      // Supprimer le fichier uploadé si données invalides
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'person_id et type_media sont obligatoires' });
    }
    
    const mediaData = {
      person_id,
      type_media,
      chemin_fichier: `/uploads/${req.file.filename}`,
      description: description || null,
      date_media: date_media || null,
      taille_fichier: req.file.size,
      principale: principale === 'true' || principale === true
    };
    
    const mediaId = await Media.create(mediaData);
    const media = await Media.getById(mediaId);
    
    res.status(201).json({ 
      message: 'Média uploadé avec succès', 
      media 
    });
  } catch (error) {
    console.error('Erreur uploadMedia:', error);
    // Supprimer le fichier en cas d'erreur
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({ error: 'Erreur lors de l\'upload du média' });
  }
};

/**
 * Met à jour un média
 */
exports.updateMedia = async (req, res) => {
  try {
    const updated = await Media.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Média non trouvé' });
    }
    
    const media = await Media.getById(req.params.id);
    res.json({ 
      message: 'Média mis à jour avec succès', 
      media 
    });
  } catch (error) {
    console.error('Erreur updateMedia:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du média' });
  }
};

/**
 * Supprime un média
 */
exports.deleteMedia = async (req, res) => {
  try {
    const media = await Media.getById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Média non trouvé' });
    }
    
    // Supprimer le fichier physique
    const filePath = path.join(__dirname, '..', media.chemin_fichier);
    await fs.unlink(filePath).catch(err => {
      console.warn('Fichier déjà supprimé:', err.message);
    });
    
    // Supprimer de la base de données
    await Media.delete(req.params.id);
    
    res.json({ message: 'Média supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteMedia:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du média' });
  }
};

/**
 * Définit un média comme photo principale
 */
exports.setAsPrincipal = async (req, res) => {
  try {
    const success = await Media.setAsPrincipal(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Média non trouvé ou n\'est pas une photo' });
    }
    
    const media = await Media.getById(req.params.id);
    res.json({ 
      message: 'Photo principale définie avec succès', 
      media 
    });
  } catch (error) {
    console.error('Erreur setAsPrincipal:', error);
    res.status(500).json({ error: 'Erreur lors de la définition de la photo principale' });
  }
};

// Export du middleware upload
exports.upload = upload;
