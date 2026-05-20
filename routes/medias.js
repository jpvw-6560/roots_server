// routes/medias.js
// Routes pour les médias (photos, documents)

const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');

// Routes CRUD
router.get('/', mediaController.getAllMedias);
router.get('/:id', mediaController.getMediaById);
router.put('/:id', mediaController.updateMedia);
router.delete('/:id', mediaController.deleteMedia);

// Upload de média
router.post('/upload', mediaController.upload.single('file'), mediaController.uploadMedia);

// Médias par personne
router.get('/person/:personId', mediaController.getMediasByPerson);

// Définir comme photo principale
router.patch('/:id/principal', mediaController.setAsPrincipal);

module.exports = router;
