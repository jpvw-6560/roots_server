// controllers/relationController.js
// Contrôleur pour la gestion des relations

const Relation = require('../models/Relation');

/**
 * Récupère toutes les relations
 */
exports.getAllRelations = async (req, res) => {
  try {
    const relations = await Relation.getAll();
    res.json(relations);
  } catch (error) {
    console.error('Erreur getAllRelations:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des relations' });
  }
};

/**
 * Récupère une relation par ID
 */
exports.getRelationById = async (req, res) => {
  try {
    const relation = await Relation.getById(req.params.id);
    if (!relation) {
      return res.status(404).json({ error: 'Relation non trouvée' });
    }
    res.json(relation);
  } catch (error) {
    console.error('Erreur getRelationById:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la relation' });
  }
};

/**
 * Crée une nouvelle relation
 */
exports.createRelation = async (req, res) => {
  try {
    const { person1_id, person2_id, type_relation } = req.body;
    
    // Validation
    if (!person1_id || !person2_id || !type_relation) {
      return res.status(400).json({ 
        error: 'person1_id, person2_id et type_relation sont obligatoires' 
      });
    }
    
    if (person1_id === person2_id) {
      return res.status(400).json({ 
        error: 'Une personne ne peut pas avoir une relation avec elle-même' 
      });
    }
    
    const relationId = await Relation.create(req.body);
    const relation = await Relation.getById(relationId);
    
    res.status(201).json({ 
      message: 'Relation créée avec succès', 
      relation 
    });
  } catch (error) {
    console.error('Erreur createRelation:', error);
    if (error.message.includes('existe déjà')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors de la création de la relation' });
  }
};

/**
 * Met à jour une relation
 */
exports.updateRelation = async (req, res) => {
  try {
    const updated = await Relation.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Relation non trouvée' });
    }
    
    const relation = await Relation.getById(req.params.id);
    res.json({ 
      message: 'Relation mise à jour avec succès', 
      relation 
    });
  } catch (error) {
    console.error('Erreur updateRelation:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la relation' });
  }
};

/**
 * Supprime une relation
 */
exports.deleteRelation = async (req, res) => {
  try {
    const deleted = await Relation.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Relation non trouvée' });
    }
    
    res.json({ message: 'Relation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur deleteRelation:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la relation' });
  }
};

/**
 * Récupère les relations d'une personne
 */
exports.getRelationsByPerson = async (req, res) => {
  try {
    const relations = await Relation.getByPerson(req.params.personId);
    res.json(relations);
  } catch (error) {
    console.error('Erreur getRelationsByPerson:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des relations' });
  }
};
