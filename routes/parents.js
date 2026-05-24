const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');

// Routes pour les couples de parents

// GET /api/parents - Récupérer tous les couples
router.get('/', parentController.getAllParents);

// GET /api/parents/with-children - Récupérer tous les couples avec leurs enfants
router.get('/with-children', parentController.getAllParentsWithChildren);

// GET /api/parents/:id - Récupérer un couple par ID avec ses enfants
router.get('/:id', parentController.getParentById);

// GET /api/parents/child/:childId - Récupérer les parents d'une personne
router.get('/child/:childId', parentController.getParentsByChildId);

// GET /api/parents/:id/children - Récupérer les enfants d'un couple
router.get('/:id/children', parentController.getChildrenByParentId);

// POST /api/parents - Créer un nouveau couple
router.post('/', parentController.createParent);

// POST /api/parents/find-or-create - Trouver ou créer un couple
router.post('/find-or-create', parentController.findOrCreateParent);

// PUT /api/parents/:id - Mettre à jour un couple
router.put('/:id', parentController.updateParent);

// DELETE /api/parents/:id - Supprimer un couple
router.delete('/:id', parentController.deleteParent);

module.exports = router;
