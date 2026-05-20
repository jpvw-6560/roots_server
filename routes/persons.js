// routes/persons.js
// Routes pour les personnes

const express = require('express');
const router = express.Router();
const personController = require('../controllers/personController');

// Routes de recherche et liste
router.get('/', personController.getAllPersons);
router.get('/search', personController.searchPersons);

// Routes CRUD de base
router.post('/', personController.createPerson);
router.get('/:id', personController.getPersonById);
router.put('/:id', personController.updatePerson);
router.delete('/:id', personController.deletePerson);

// Routes pour les relations familiales
router.get('/:id/parents', personController.getParents);
router.get('/:id/children', personController.getChildren);
router.get('/:id/spouses', personController.getSpouses);

module.exports = router;
