// routes/relations.js
// Routes pour les relations entre personnes

const express = require('express');
const router = express.Router();
const relationController = require('../controllers/relationController');

// Routes CRUD
router.get('/', relationController.getAllRelations);
router.post('/', relationController.createRelation);
router.get('/:id', relationController.getRelationById);
router.put('/:id', relationController.updateRelation);
router.delete('/:id', relationController.deleteRelation);

// Relations par personne
router.get('/person/:personId', relationController.getRelationsByPerson);

module.exports = router;
