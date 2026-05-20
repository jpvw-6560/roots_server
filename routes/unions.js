// routes/unions.js
// Routes pour la gestion des unions (mariages, PACS, unions libres)

const express = require('express');
const router = express.Router();
const Union = require('../models/Union');

/**
 * GET /api/unions
 * Récupérer toutes les unions
 */
router.get('/', async (req, res) => {
  try {
    const unions = await Union.getAll();
    res.json(unions);
  } catch (error) {
    console.error('Erreur GET /unions:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des unions' });
  }
});

/**
 * GET /api/unions/:id
 * Récupérer une union par son ID
 */
router.get('/:id', async (req, res) => {
  try {
    const union = await Union.getById(req.params.id);
    if (!union) {
      return res.status(404).json({ error: 'Union non trouvée' });
    }
    res.json(union);
  } catch (error) {
    console.error('Erreur GET /unions/:id:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'union' });
  }
});

/**
 * GET /api/unions/person/:personId
 * Récupérer toutes les unions d'une personne
 */
router.get('/person/:personId', async (req, res) => {
  try {
    const unions = await Union.getByPersonId(req.params.personId);
    res.json(unions);
  } catch (error) {
    console.error('Erreur GET /unions/person/:personId:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des unions' });
  }
});

/**
 * GET /api/unions/:id/children
 * Récupérer les enfants d'une union
 */
router.get('/:id/children', async (req, res) => {
  try {
    const children = await Union.getChildren(req.params.id);
    res.json(children);
  } catch (error) {
    console.error('Erreur GET /unions/:id/children:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des enfants' });
  }
});

/**
 * POST /api/unions
 * Créer une nouvelle union
 * Body: { person1_id, person2_id, date_debut?, date_fin?, type_union? }
 */
router.post('/', async (req, res) => {
  try {
    const { person1_id, person2_id, date_debut, date_fin, type_union } = req.body;
    
    if (!person1_id) {
      return res.status(400).json({ error: 'person1_id est obligatoire' });
    }
    
    const unionId = await Union.create({
      person1_id,
      person2_id,
      date_debut,
      date_fin,
      type_union
    });
    
    const union = await Union.getById(unionId);
    res.status(201).json(union);
  } catch (error) {
    console.error('Erreur POST /unions:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'union' });
  }
});

/**
 * POST /api/unions/:id/children
 * Ajouter un enfant à une union
 * Body: { child_id, ordre_naissance? }
 */
router.post('/:id/children', async (req, res) => {
  try {
    const unionId = req.params.id;
    const { child_id, ordre_naissance } = req.body;
    
    if (!child_id) {
      return res.status(400).json({ error: 'child_id est obligatoire' });
    }
    
    await Union.addChild(unionId, child_id, ordre_naissance);
    const children = await Union.getChildren(unionId);
    res.json(children);
  } catch (error) {
    console.error('Erreur POST /unions/:id/children:', error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'enfant' });
  }
});

/**
 * PUT /api/unions/:id
 * Mettre à jour une union
 * Body: { person1_id?, person2_id?, date_debut?, date_fin?, type_union? }
 */
router.put('/:id', async (req, res) => {
  try {
    const updated = await Union.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Union non trouvée' });
    }
    const union = await Union.getById(req.params.id);
    res.json(union);
  } catch (error) {
    console.error('Erreur PUT /unions/:id:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'union' });
  }
});

/**
 * DELETE /api/unions/:id/children/:childId
 * Retirer un enfant d'une union
 */
router.delete('/:id/children/:childId', async (req, res) => {
  try {
    const deleted = await Union.removeChild(req.params.id, req.params.childId);
    if (!deleted) {
      return res.status(404).json({ error: 'Association non trouvée' });
    }
    res.json({ message: 'Enfant retiré de l\'union avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /unions/:id/children/:childId:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

/**
 * DELETE /api/unions/:id
 * Supprimer une union
 * Attention : supprime aussi les associations avec les enfants (CASCADE)
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Union.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Union non trouvée' });
    }
    res.json({ message: 'Union supprimée avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /unions/:id:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'union' });
  }
});

module.exports = router;
