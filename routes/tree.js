// routes/tree.js
// Routes pour l'arbre généalogique

const express = require('express');
const router = express.Router();
const treeController = require('../controllers/treeController');

// Génération d'arbre pour une personne
router.get('/:personId', treeController.getTree);

// Arbre complet
router.get('/', treeController.getFullTree);

// Statistiques
router.get('/stats/all', treeController.getStats);

module.exports = router;
