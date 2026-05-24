const Parent = require('../models/Parent');

/**
 * Récupérer tous les couples de parents
 */
exports.getAllParents = async (req, res) => {
  try {
    const parents = await Parent.findAll();
    res.json(parents);
  } catch (error) {
    console.error('Erreur lors de la récupération des parents:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des parents',
      details: error.message 
    });
  }
};

/**
 * Récupérer tous les couples avec leurs enfants
 */
exports.getAllParentsWithChildren = async (req, res) => {
  try {
    const parentsWithChildren = await Parent.findAllWithChildren();
    res.json(parentsWithChildren);
  } catch (error) {
    console.error('Erreur lors de la récupération des parents avec enfants:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des parents avec enfants',
      details: error.message 
    });
  }
};

/**
 * Récupérer un couple de parents par ID
 */
exports.getParentById = async (req, res) => {
  try {
    const { id } = req.params;
    const parent = await Parent.findById(id);
    
    if (!parent) {
      return res.status(404).json({ error: 'Couple de parents non trouvé' });
    }
    
    // Récupérer les enfants
    const children = await Parent.findChildren(id);
    parent.children = children;
    
    res.json(parent);
  } catch (error) {
    console.error('Erreur lors de la récupération du couple:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du couple',
      details: error.message 
    });
  }
};

/**
 * Récupérer les parents d'une personne
 */
exports.getParentsByChildId = async (req, res) => {
  try {
    const { childId } = req.params;
    const parent = await Parent.findByChildId(childId);
    
    if (!parent) {
      return res.status(404).json({ error: 'Parents non trouvés pour cette personne' });
    }
    
    res.json(parent);
  } catch (error) {
    console.error('Erreur lors de la récupération des parents:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des parents',
      details: error.message 
    });
  }
};

/**
 * Récupérer les enfants d'un couple
 */
exports.getChildrenByParentId = async (req, res) => {
  try {
    const { id } = req.params;
    const children = await Parent.findChildren(id);
    
    res.json(children);
  } catch (error) {
    console.error('Erreur lors de la récupération des enfants:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des enfants',
      details: error.message 
    });
  }
};

/**
 * Créer un nouveau couple de parents
 */
exports.createParent = async (req, res) => {
  try {
    const { id_pere, id_mere, date_mariage, lieu_mariage, date_divorce } = req.body;
    
    if (!id_pere || !id_mere) {
      return res.status(400).json({ error: 'Le père et la mère sont obligatoires' });
    }
    
    const parentId = await Parent.create({
      id_pere,
      id_mere,
      date_mariage,
      lieu_mariage,
      date_divorce
    });
    
    res.status(201).json({ 
      message: 'Couple de parents créé avec succès',
      id: parentId 
    });
  } catch (error) {
    console.error('Erreur lors de la création du couple:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du couple',
      details: error.message 
    });
  }
};

/**
 * Mettre à jour un couple de parents
 */
exports.updateParent = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_pere, id_mere, date_mariage, lieu_mariage, date_divorce } = req.body;
    
    if (!id_pere || !id_mere) {
      return res.status(400).json({ error: 'Le père et la mère sont obligatoires' });
    }
    
    const success = await Parent.update(id, {
      id_pere,
      id_mere,
      date_mariage,
      lieu_mariage,
      date_divorce
    });
    
    if (!success) {
      return res.status(404).json({ error: 'Couple de parents non trouvé' });
    }
    
    res.json({ message: 'Couple de parents mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du couple:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du couple',
      details: error.message 
    });
  }
};

/**
 * Supprimer un couple de parents
 */
exports.deleteParent = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await Parent.delete(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Couple de parents non trouvé' });
    }
    
    res.json({ message: 'Couple de parents supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du couple:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du couple',
      details: error.message 
    });
  }
};

/**
 * Trouver ou créer un couple de parents
 */
exports.findOrCreateParent = async (req, res) => {
  try {
    const { id_pere, id_mere, date_mariage, lieu_mariage, date_divorce } = req.body;
    
    if (!id_pere || !id_mere) {
      return res.status(400).json({ error: 'Le père et la mère sont obligatoires' });
    }
    
    const parentId = await Parent.findOrCreate(id_pere, id_mere, {
      date_mariage,
      lieu_mariage,
      date_divorce
    });
    
    res.json({ 
      message: 'Couple de parents trouvé ou créé',
      id: parentId 
    });
  } catch (error) {
    console.error('Erreur lors du findOrCreate:', error);
    res.status(500).json({ 
      error: 'Erreur lors du findOrCreate',
      details: error.message 
    });
  }
};
