// controllers/treeController.js
// Contrôleur pour la génération de l'arbre généalogique

const Person = require('../models/Person');

/**
 * Génère les données de l'arbre généalogique pour une personne
 */
exports.getTree = async (req, res) => {
  try {
    const personId = parseInt(req.params.personId);
    const type = req.query.type || 'both'; // both, ancestors, descendants
    const generations = parseInt(req.query.generations) || 3;
    
    const person = await Person.getById(personId);
    if (!person) {
      return res.status(404).json({ error: 'Personne non trouvée' });
    }
    
    let tree = {};
    
    if (type === 'ancestors' || type === 'both') {
      tree.ancestors = await buildAncestorsTree(personId, generations);
    }
    
    if (type === 'descendants' || type === 'both') {
      tree.descendants = await buildDescendantsTree(personId, generations);
    }
    
    tree.root = person;
    
    res.json(tree);
  } catch (error) {
    console.error('Erreur getTree:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de l\'arbre' });
  }
};

/**
 * Construit l'arbre des ancêtres (ascendants)
 */
async function buildAncestorsTree(personId, generations, currentGen = 0, visited = new Set()) {
  if (currentGen >= generations || visited.has(personId)) {
    return null;
  }
  
  visited.add(personId);
  
  const person = await Person.getById(personId);
  if (!person) return null;
  
  const parents = await Person.getParents(personId);
  
  const node = {
    id: person.id,
    nom: person.nom,
    prenom: person.prenom,
    sexe: person.sexe,
    date_naissance: person.date_naissance,
    date_deces: person.date_deces,
    photo: person.photo_principale,
    parents: []
  };
  
  for (const parent of parents) {
    const parentTree = await buildAncestorsTree(parent.id, generations, currentGen + 1, visited);
    if (parentTree) {
      node.parents.push(parentTree);
    }
  }
  
  return node;
}

/**
 * Construit l'arbre des descendants
 */
async function buildDescendantsTree(personId, generations, currentGen = 0, visited = new Set()) {
  if (currentGen >= generations || visited.has(personId)) {
    return null;
  }
  
  visited.add(personId);
  
  const person = await Person.getById(personId);
  if (!person) return null;
  
  const children = await Person.getChildren(personId);
  const spouses = await Person.getSpouses(personId);
  
  const node = {
    id: person.id,
    nom: person.nom,
    prenom: person.prenom,
    sexe: person.sexe,
    date_naissance: person.date_naissance,
    date_deces: person.date_deces,
    photo: person.photo_principale,
    spouses: spouses.map(s => ({
      id: s.id,
      nom: s.nom,
      prenom: s.prenom,
      date_debut: s.date_debut,
      date_fin: s.date_fin
    })),
    children: []
  };
  
  for (const child of children) {
    const childTree = await buildDescendantsTree(child.id, generations, currentGen + 1, visited);
    if (childTree) {
      node.children.push(childTree);
    }
  }
  
  return node;
}

/**
 * Récupère les statistiques de l'arbre
 */
exports.getStats = async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    const [stats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_persons,
        SUM(CASE WHEN p.sexe = 'M' THEN 1 ELSE 0 END) as total_males,
        SUM(CASE WHEN p.sexe = 'F' THEN 1 ELSE 0 END) as total_females,
        SUM(CASE WHEN p.vivant = TRUE THEN 1 ELSE 0 END) as total_living,
        SUM(CASE WHEN p.vivant = FALSE THEN 1 ELSE 0 END) as total_deceased,
        COUNT(DISTINCT r.id) as total_relations,
        COUNT(DISTINCT m.id) as total_medias
      FROM persons p
      LEFT JOIN relations r ON p.id = r.person1_id OR p.id = r.person2_id
      LEFT JOIN medias m ON p.id = m.person_id
    `);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Erreur getStats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
};

/**
 * Récupère toutes les personnes pour affichage d'arbre complet
 */
exports.getFullTree = async (req, res) => {
  try {
    const persons = await Person.getAll();
    const { pool } = require('../config/database');
    
    // Récupérer toutes les relations
    const [relations] = await pool.query(`
      SELECT person1_id, person2_id, type_relation, date_debut, date_fin
      FROM relations
    `);
    
    res.json({
      persons,
      relations
    });
  } catch (error) {
    console.error('Erreur getFullTree:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de l\'arbre complet' });
  }
};
