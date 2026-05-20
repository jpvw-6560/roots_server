// controllers/personController.js
// Contrôleur pour la gestion des personnes

const Person = require('../models/Person');

/**
 * Récupère toutes les personnes
 */
exports.getAllPersons = async (req, res) => {
  try {
    const persons = await Person.getAll();
    res.json(persons);
  } catch (error) {
    console.error('Erreur getAllPersons:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des personnes' });
  }
};

/**
 * Récupère une personne par ID
 */
exports.getPersonById = async (req, res) => {
  try {
    const person = await Person.getById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Personne non trouvée' });
    }
    res.json(person);
  } catch (error) {
    console.error('Erreur getPersonById:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la personne' });
  }
};

/**
 * Crée une nouvelle personne
 */
exports.createPerson = async (req, res) => {
  try {
    const { nom, sexe } = req.body;
    
    // Validation
    if (!nom || !sexe) {
      return res.status(400).json({ error: 'Le nom et le sexe sont obligatoires' });
    }
    
    const personId = await Person.create(req.body);
    const person = await Person.getById(personId);
    
    res.status(201).json({ 
      message: 'Personne créée avec succès', 
      person 
    });
  } catch (error) {
    console.error('Erreur createPerson:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la personne' });
  }
};

/**
 * Met à jour une personne
 */
exports.updatePerson = async (req, res) => {
  try {
    const updated = await Person.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Personne non trouvée' });
    }
    
    const person = await Person.getById(req.params.id);
    res.json({ 
      message: 'Personne mise à jour avec succès', 
      person 
    });
  } catch (error) {
    console.error('Erreur updatePerson:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la personne' });
  }
};

/**
 * Supprime une personne
 */
exports.deletePerson = async (req, res) => {
  try {
    const deleted = await Person.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Personne non trouvée' });
    }
    
    res.json({ message: 'Personne supprimée avec succès' });
  } catch (error) {
    console.error('Erreur deletePerson:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la personne' });
  }
};

/**
 * Recherche des personnes
 */
exports.searchPersons = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Le terme de recherche doit contenir au moins 2 caractères' });
    }
    
    const persons = await Person.search(q);
    res.json(persons);
  } catch (error) {
    console.error('Erreur searchPersons:', error);
    res.status(500).json({ error: 'Erreur lors de la recherche' });
  }
};

/**
 * Récupère les parents d'une personne
 */
exports.getParents = async (req, res) => {
  try {
    const parents = await Person.getParents(req.params.id);
    res.json(parents);
  } catch (error) {
    console.error('Erreur getParents:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des parents' });
  }
};

/**
 * Récupère les enfants d'une personne
 */
exports.getChildren = async (req, res) => {
  try {
    const children = await Person.getChildren(req.params.id);
    res.json(children);
  } catch (error) {
    console.error('Erreur getChildren:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des enfants' });
  }
};

/**
 * Récupère les conjoints d'une personne
 */
exports.getSpouses = async (req, res) => {
  try {
    const spouses = await Person.getSpouses(req.params.id);
    res.json(spouses);
  } catch (error) {
    console.error('Erreur getSpouses:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des conjoints' });
  }
};
