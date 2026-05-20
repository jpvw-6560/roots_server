# PLAN DÉTAILLÉ DE REFACTORING
## Transformation vers le modèle Person → Union → Children

**Version** : 1.0  
**Date** : 20 mai 2026  
**Durée estimée** : 6-8 heures  
**Complexité** : ⭐⭐⭐⭐ (Élevée)

---

## 📊 ÉTAT DES LIEUX

### Architecture Actuelle

```
┌─────────────┐
│   Person    │
├─────────────┤
│ - id        │
│ - nom       │
│ - prenom    │
└──────┬──────┘
       │
       ├──► getChildren() → [Person]
       ├──► getParents()  → [Person]
       └──► getSpouses()  → [Person]
```

**Tables existantes :**
- `persons` : données des personnes
- `relations` : relations parent/enfant/conjoint
- `medias` : photos et documents

**Problèmes identifiés :**
1. ❌ Impossible de savoir quel enfant appartient à quel couple
2. ❌ Familles recomposées mal modélisées
3. ❌ Conjoints dissociés des enfants
4. ❌ Arbre graphique avec croisements
5. ❌ Non-conforme au standard GEDCOM

---

## 🎯 ARCHITECTURE CIBLE

### Nouveau Modèle

```
┌─────────────┐
│   Person    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Union    │◄─── Nouveau concept central
├─────────────┤
│ - id        │
│ - partner1  │
│ - partner2  │
│ - type      │
│ - date_debut│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Children   │
└─────────────┘
```

**Nouvelles tables :**
- `unions` : représente chaque couple (mariage, concubinage, etc.)
- `union_children` : lie chaque enfant à UNE union spécifique

**Avantages :**
1. ✅ Modélisation correcte des familles recomposées
2. ✅ Chaque enfant rattaché à UN couple précis
3. ✅ Compatible GEDCOM
4. ✅ Graphe propre et sans ambiguïté
5. ✅ Extensible (adoption, GPA, etc.)

---

## 📋 PLAN D'EXÉCUTION

### PHASE 1 : PRÉPARATION (1h)

#### Étape 1.1 : Backup complet
- [ ] Dump SQL de la base actuelle
  ```bash
  mysqldump -u root -p neogenea > backup_pre_refactor_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Sauvegarde du dossier `uploads/`
- [ ] Commit Git avec tag `pre-refactor`

#### Étape 1.2 : Analyse des données existantes
- [ ] Compter le nombre de personnes
- [ ] Identifier toutes les relations `conjoint`
- [ ] Identifier toutes les relations `parent`/`enfant`
- [ ] Détecter les cas complexes (remariages, familles recomposées)

```sql
-- Script d'analyse
SELECT 
  COUNT(*) as total_personnes 
FROM persons;

SELECT 
  type_relation, 
  COUNT(*) as nb 
FROM relations 
GROUP BY type_relation;

-- Identifier les remariages
SELECT 
  person1_id, 
  COUNT(*) as nb_conjoints 
FROM relations 
WHERE type_relation = 'conjoint' 
GROUP BY person1_id 
HAVING nb_conjoints > 1;
```

#### Étape 1.3 : Créer branche Git dédiée
```bash
git checkout -b refactor/union-model
```

---

### PHASE 2 : CRÉATION DES NOUVELLES TABLES (30 min)

#### Étape 2.1 : Créer table `unions`

**Fichier** : `config/database.js` ou nouveau script `migrations/001_create_unions.sql`

```sql
CREATE TABLE IF NOT EXISTS unions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Partenaires (partner2 peut être NULL pour parent inconnu)
    partner1_id INT NOT NULL,
    partner2_id INT NULL,
    
    -- Type d'union
    type_union ENUM(
        'mariage',
        'concubinage',
        'pacs',
        'union_libre',
        'inconnu'
    ) DEFAULT 'inconnu',
    
    -- Dates
    date_debut DATE NULL,
    date_fin DATE NULL,
    
    -- Métadonnées
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Contraintes
    FOREIGN KEY (partner1_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (partner2_id) REFERENCES persons(id) ON DELETE CASCADE,
    
    -- Index
    INDEX idx_partner1 (partner1_id),
    INDEX idx_partner2 (partner2_id),
    INDEX idx_date_debut (date_debut)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Étape 2.2 : Créer table `union_children`

```sql
CREATE TABLE IF NOT EXISTS union_children (
    union_id INT NOT NULL,
    child_id INT NOT NULL,
    
    -- Type de filiation (pour extensions futures)
    type_filiation ENUM(
        'biologique',
        'adoption',
        'reconnaissance',
        'inconnu'
    ) DEFAULT 'biologique',
    
    -- Métadonnées
    ordre_naissance INT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Clé primaire composite
    PRIMARY KEY (union_id, child_id),
    
    -- Contraintes
    FOREIGN KEY (union_id) REFERENCES unions(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES persons(id) ON DELETE CASCADE,
    
    -- Index
    INDEX idx_child (child_id)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Étape 2.3 : Vérification
- [ ] Tables créées sans erreur
- [ ] Contraintes de clés étrangères actives
- [ ] Index créés

```sql
SHOW TABLES;
DESCRIBE unions;
DESCRIBE union_children;
```

---

### PHASE 3 : MIGRATION DES DONNÉES (1h30)

#### Étape 3.1 : Créer script de migration

**Fichier** : `scripts/migrate-to-unions.js`

**Logique :**

1. **Identifier tous les couples** (relations `conjoint`)
2. **Créer une union pour chaque couple**
3. **Associer les enfants à chaque union**

**Algorithme détaillé :**

```javascript
// Pseudo-code
for each relation WHERE type_relation = 'conjoint' {
    // Créer l'union
    union_id = INSERT INTO unions (
        partner1_id, 
        partner2_id, 
        date_debut, 
        date_fin
    );
    
    // Trouver les enfants communs
    children_partner1 = SELECT child_id FROM relations 
                        WHERE person1_id = partner1 AND type_relation = 'parent';
    
    children_partner2 = SELECT child_id FROM relations 
                        WHERE person1_id = partner2 AND type_relation = 'parent';
    
    common_children = INTERSECT(children_partner1, children_partner2);
    
    // Associer les enfants à l'union
    for each child in common_children {
        INSERT INTO union_children (union_id, child_id);
    }
}

// Cas spéciaux : enfants sans couple identifié
for each child WHERE no union_children entry {
    // Créer une union avec un seul parent
    parent = SELECT person1_id FROM relations 
             WHERE person2_id = child AND type_relation = 'parent';
    
    if parent {
        union_id = INSERT INTO unions (
            partner1_id = parent,
            partner2_id = NULL
        );
        
        INSERT INTO union_children (union_id, child_id);
    }
}
```

#### Étape 3.2 : Tests de la migration

**Fichier** : `scripts/test-migration.js`

Vérifications :
- [ ] Nombre d'unions créées = nombre de couples + parents seuls
- [ ] Tous les enfants sont rattachés à une union
- [ ] Pas de doublons
- [ ] Cohérence des dates

```sql
-- Vérifications post-migration
SELECT COUNT(*) as nb_unions FROM unions;
SELECT COUNT(*) as nb_enfants_rattaches FROM union_children;

-- Enfants orphelins (sans union)
SELECT p.id, p.nom, p.prenom 
FROM persons p
LEFT JOIN union_children uc ON p.id = uc.child_id
WHERE uc.child_id IS NULL
AND p.id IN (
    SELECT person2_id FROM relations WHERE type_relation = 'enfant'
);
```

#### Étape 3.3 : Rollback si échec
Si la migration échoue :
```bash
mysql -u root -p neogenea < backup_pre_refactor_YYYYMMDD_HHMMSS.sql
```

---

### PHASE 4 : CRÉATION DU MODÈLE UNION.JS (1h)

#### Étape 4.1 : Créer le fichier

**Fichier** : `models/Union.js`

```javascript
// models/Union.js
const { pool } = require('../config/database');

class Union {
  /**
   * Récupère toutes les unions d'une personne
   * @param {number} personId 
   * @returns {Array} Liste des unions
   */
  static async getByPerson(personId) {
    const [rows] = await pool.query(`
      SELECT u.*,
             p1.id as partner1_id, p1.nom as partner1_nom, p1.prenom as partner1_prenom,
             p2.id as partner2_id, p2.nom as partner2_nom, p2.prenom as partner2_prenom
      FROM unions u
      LEFT JOIN persons p1 ON u.partner1_id = p1.id
      LEFT JOIN persons p2 ON u.partner2_id = p2.id
      WHERE u.partner1_id = ? OR u.partner2_id = ?
      ORDER BY u.date_debut
    `, [personId, personId]);
    return rows;
  }
  
  /**
   * Récupère le conjoint d'une personne dans une union
   * @param {number} unionId 
   * @param {number} currentPersonId 
   * @returns {Object|null} Le conjoint
   */
  static async getSpouse(unionId, currentPersonId) {
    const [rows] = await pool.query(`
      SELECT u.partner1_id, u.partner2_id,
             p1.*, p2.*
      FROM unions u
      LEFT JOIN persons p1 ON u.partner1_id = p1.id
      LEFT JOIN persons p2 ON u.partner2_id = p2.id
      WHERE u.id = ?
    `, [unionId]);
    
    if (rows.length === 0) return null;
    
    const union = rows[0];
    
    // Retourner le partenaire qui n'est pas la personne courante
    if (union.partner1_id === currentPersonId) {
      return union.partner2_id ? {
        id: union.partner2_id,
        nom: union['p2.nom'],
        prenom: union['p2.prenom'],
        // ... autres champs
      } : null;
    } else {
      return {
        id: union.partner1_id,
        nom: union['p1.nom'],
        prenom: union['p1.prenom'],
        // ... autres champs
      };
    }
  }
  
  /**
   * Récupère les enfants d'une union
   * @param {number} unionId 
   * @returns {Array} Liste des enfants
   */
  static async getChildren(unionId) {
    const [rows] = await pool.query(`
      SELECT p.*, uc.type_filiation, uc.ordre_naissance
      FROM union_children uc
      JOIN persons p ON uc.child_id = p.id
      WHERE uc.union_id = ?
      ORDER BY uc.ordre_naissance, p.date_naissance
    `, [unionId]);
    return rows;
  }
  
  /**
   * Crée une nouvelle union
   * @param {Object} unionData 
   * @returns {number} ID de l'union créée
   */
  static async create(unionData) {
    const { partner1_id, partner2_id, type_union, date_debut, date_fin, notes } = unionData;
    
    const [result] = await pool.query(`
      INSERT INTO unions (partner1_id, partner2_id, type_union, date_debut, date_fin, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [partner1_id, partner2_id || null, type_union || 'inconnu', 
        date_debut || null, date_fin || null, notes || null]);
    
    return result.insertId;
  }
  
  /**
   * Ajoute un enfant à une union
   * @param {number} unionId 
   * @param {number} childId 
   * @param {Object} options 
   */
  static async addChild(unionId, childId, options = {}) {
    const { type_filiation, ordre_naissance, notes } = options;
    
    await pool.query(`
      INSERT INTO union_children (union_id, child_id, type_filiation, ordre_naissance, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [unionId, childId, type_filiation || 'biologique', 
        ordre_naissance || null, notes || null]);
  }
  
  /**
   * Supprime une union (CASCADE supprimera les union_children)
   * @param {number} unionId 
   */
  static async delete(unionId) {
    const [result] = await pool.query('DELETE FROM unions WHERE id = ?', [unionId]);
    return result.affectedRows > 0;
  }
}

module.exports = Union;
```

#### Étape 4.2 : Tests unitaires

**Fichier** : `tests/union.test.js`

Tests à effectuer :
- [ ] Création d'union
- [ ] Récupération des unions d'une personne
- [ ] Récupération du conjoint
- [ ] Récupération des enfants
- [ ] Ajout d'enfant
- [ ] Suppression d'union

---

### PHASE 5 : MODIFICATION DU BACKEND (2h)

#### Étape 5.1 : Modifier `treeController.js`

**Fichier** : `controllers/treeController.js`

**Changements principaux :**

```javascript
// AVANT
const children = await Person.getChildren(personId);
const spouses = await Person.getSpouses(personId);

// APRÈS
const unions = await Union.getByPerson(personId);

for (const union of unions) {
    const spouse = await Union.getSpouse(union.id, personId);
    const children = await Union.getChildren(union.id);
    
    node.unions.push({
        id: union.id,
        type_union: union.type_union,
        spouse: spouse,
        children: children.map(child => ({
            id: child.id,
            nom: child.nom,
            prenom: child.prenom,
            // ...
        }))
    });
}
```

**Nouvelle structure de `buildDescendantsTree` :**

```javascript
async function buildDescendantsTree(personId, generations, currentGen = 0, visited = new Set()) {
  if (currentGen >= generations || visited.has(personId)) {
    return null;
  }
  
  visited.add(personId);
  
  const person = await Person.getById(personId);
  if (!person) return null;
  
  // ✨ NOUVEAU : Utiliser le modèle Union
  const unions = await Union.getByPerson(personId);
  
  const node = {
    id: person.id,
    nom: person.nom,
    prenom: person.prenom,
    sexe: person.sexe,
    date_naissance: person.date_naissance,
    date_deces: person.date_deces,
    photo: person.photo_principale,
    unions: [] // ✨ NOUVEAU
  };
  
  // ✨ NOUVEAU : Parcourir chaque union
  for (const union of unions) {
    const spouse = await Union.getSpouse(union.id, personId);
    const children = await Union.getChildren(union.id);
    
    const childrenTree = [];
    for (const child of children) {
      const childTree = await buildDescendantsTree(child.id, generations, currentGen + 1, visited);
      if (childTree) {
        childrenTree.push(childTree);
      }
    }
    
    node.unions.push({
      id: union.id,
      type_union: union.type_union,
      date_debut: union.date_debut,
      date_fin: union.date_fin,
      spouse: spouse ? {
        id: spouse.id,
        nom: spouse.nom,
        prenom: spouse.prenom,
        sexe: spouse.sexe,
        date_naissance: spouse.date_naissance
      } : null,
      children: childrenTree
    });
  }
  
  return node;
}
```

#### Étape 5.2 : Créer nouvelles routes API

**Fichier** : `routes/unions.js`

```javascript
// routes/unions.js
const express = require('express');
const router = express.Router();
const Union = require('../models/Union');

// GET /api/unions/:personId
router.get('/:personId', async (req, res) => {
  try {
    const personId = parseInt(req.params.personId);
    const unions = await Union.getByPerson(personId);
    res.json(unions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/unions
router.post('/', async (req, res) => {
  try {
    const unionId = await Union.create(req.body);
    res.json({ id: unionId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/unions/:unionId/children
router.post('/:unionId/children', async (req, res) => {
  try {
    const unionId = parseInt(req.params.unionId);
    const { childId, ...options } = req.body;
    await Union.addChild(unionId, childId, options);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/unions/:id
router.delete('/:id', async (req, res) => {
  try {
    const unionId = parseInt(req.params.id);
    await Union.delete(unionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### Étape 5.3 : Enregistrer les routes

**Fichier** : `src/server.js`

```javascript
// Ajouter après les autres routes
const unionsRouter = require('../routes/unions');
app.use('/api/unions', unionsRouter);
```

---

### PHASE 6 : MODIFICATION DU FRONTEND (2h)

#### Étape 6.1 : Adapter `tree-canvas.js`

**Fichier** : `public/tree-canvas.js`

**Changements principaux :**

1. **Structure de données :**
```javascript
// AVANT
node = {
    person: {...},
    spouse: {...},
    children: [...]
}

// APRÈS
node = {
    person: {...},
    unions: [
        {
            id: 1,
            spouse: {...},
            children: [...]
        },
        {
            id: 2,
            spouse: {...},
            children: [...]
        }
    ]
}
```

2. **Rendu graphique :**
```javascript
// Pour chaque union
node.unions.forEach(union => {
    // Dessiner le conjoint
    drawNode(ctx, union.spouse);
    
    // Dessiner le lien de mariage
    drawMarriageLink(ctx, node.person, union.spouse);
    
    // Dessiner les enfants de cette union
    union.children.forEach(child => {
        drawNode(ctx, child);
        drawParentChildLink(ctx, union, child);
    });
});
```

3. **Positionnement :**
- Chaque union = groupe visuel distinct
- Espacement entre unions multiples
- Regroupement des enfants par union

#### Étape 6.2 : Adapter `app.js`

**Fichier** : `public/app.js`

**Changements :**
- Adapter `generateCompleteTree()` pour nouvelle structure JSON
- Mettre à jour l'affichage des détails de personne
- Ajouter interface de gestion des unions

```javascript
// Nouvelle fonction pour afficher les unions
function displayUnions(personId, unions) {
    const container = document.getElementById('unions-list');
    
    container.innerHTML = unions.map(union => `
        <div class="union-card">
            <h4>Union ${union.id}</h4>
            <p>Type: ${union.type_union}</p>
            ${union.spouse ? `
                <p>Conjoint: ${union.spouse.prenom} ${union.spouse.nom}</p>
            ` : '<p>Parent seul</p>'}
            <p>Enfants: ${union.children.length}</p>
            <ul>
                ${union.children.map(c => `
                    <li>${c.prenom} ${c.nom}</li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}
```

---

### PHASE 7 : TESTS ET VALIDATION (1h)

#### Étape 7.1 : Tests manuels

**Scénarios de test :**

1. **Cas simple : couple avec enfants**
   - [ ] Créer un couple
   - [ ] Ajouter 2 enfants
   - [ ] Afficher l'arbre
   - [ ] Vérifier le rendu graphique

2. **Cas complexe : remariage**
   - [ ] Personne A + Personne B → Enfant 1
   - [ ] Personne A + Personne C → Enfant 2
   - [ ] Afficher l'arbre
   - [ ] Vérifier que les 2 unions sont distinctes

3. **Cas edge : parent seul**
   - [ ] Créer union avec partner2 = NULL
   - [ ] Ajouter enfant
   - [ ] Afficher l'arbre

4. **Migration des données existantes**
   - [ ] Vérifier que toutes les personnes sont affichées
   - [ ] Vérifier que tous les liens sont corrects
   - [ ] Comparer avec l'ancien arbre (captures d'écran)

#### Étape 7.2 : Tests automatisés

```bash
# Si tests unitaires disponibles
npm test

# Tests d'intégration
npm run test:integration
```

#### Étape 7.3 : Vérification SQL

```sql
-- Nombre total d'unions
SELECT COUNT(*) FROM unions;

-- Unions par personne
SELECT 
    p.id, 
    p.nom, 
    p.prenom, 
    COUNT(u.id) as nb_unions
FROM persons p
LEFT JOIN unions u ON p.id = u.partner1_id OR p.id = u.partner2_id
GROUP BY p.id
HAVING nb_unions > 1;

-- Enfants par union
SELECT 
    u.id as union_id,
    COUNT(uc.child_id) as nb_enfants
FROM unions u
LEFT JOIN union_children uc ON u.id = uc.union_id
GROUP BY u.id;

-- Enfants orphelins
SELECT p.* 
FROM persons p
LEFT JOIN union_children uc ON p.id = uc.child_id
WHERE uc.child_id IS NULL
AND EXISTS (
    SELECT 1 FROM relations r 
    WHERE r.person2_id = p.id 
    AND r.type_relation = 'enfant'
);
```

---

### PHASE 8 : NETTOYAGE ET DOCUMENTATION (30 min)

#### Étape 8.1 : Nettoyer le code obsolète

- [ ] Supprimer ou déprécier `Person.getChildren()`
- [ ] Supprimer ou déprécier `Person.getSpouses()`
- [ ] Ajouter commentaires de migration

```javascript
// models/Person.js
/**
 * @deprecated Utiliser Union.getByPerson() + Union.getChildren()
 * Conservé pour rétro-compatibilité temporaire
 */
static async getChildren(personId) {
    console.warn('Person.getChildren() est obsolète');
    // Code existant...
}
```

#### Étape 8.2 : Mettre à jour la documentation

**Fichiers à mettre à jour :**
- [ ] `README.md` : nouvelle structure API
- [ ] `doc/UTILISATION.md` : nouvelle interface utilisateur
- [ ] `doc/TECHNIQUE.md` : nouveau modèle de données

#### Étape 8.3 : Créer changelog

**Fichier** : `CHANGELOG.md`

```markdown
# Changelog

## [2.0.0] - 2026-05-20

### 🎉 BREAKING CHANGES

#### Nouveau modèle de données : Person → Union → Children

**Ajouté**
- Table `unions` : représente les couples (mariage, concubinage, etc.)
- Table `union_children` : lie les enfants aux unions
- Modèle `Union.js` avec méthodes CRUD
- Routes API `/api/unions`

**Modifié**
- `treeController.js` : utilise maintenant le modèle Union
- Structure JSON de l'arbre : ajout du champ `unions[]`
- `tree-canvas.js` : rendu graphique adapté aux unions multiples

**Déprécié**
- `Person.getChildren()` : utiliser `Union.getChildren()`
- `Person.getSpouses()` : utiliser `Union.getByPerson()`

**Migration**
- Script de migration automatique : `scripts/migrate-to-unions.js`
- Backup recommandé avant mise à jour

### Pourquoi ce changement ?

Ce refactoring permet de :
- Modéliser correctement les familles recomposées
- Gérer les remariages sans ambiguïté
- Conformité au standard GEDCOM
- Arbres graphiques plus clairs
```

---

## ⚠️ RISQUES ET POINTS D'ATTENTION

### Risques Identifiés

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Perte de données pendant migration | Faible | ⚠️⚠️⚠️ Critique | Backup complet + tests sur copie |
| Bugs dans script de migration | Moyen | ⚠️⚠️ Élevé | Tests extensifs + rollback plan |
| Régression frontend | Moyen | ⚠️ Moyen | Tests manuels + comparaison visuelle |
| Performance dégradée (JOINs) | Faible | ⚠️ Moyen | Index SQL + monitoring |
| Code legacy cassé | Élevé | ⚠️ Moyen | Garder méthodes obsolètes temporairement |

### Points Critiques

1. **Migration des données** : C'est l'étape la plus risquée
   - Tester sur copie de base d'abord
   - Vérifier chaque cas edge
   - Prévoir rollback rapide

2. **Compatibilité rétroactive** : Conserver temporairement les anciennes méthodes

3. **Tests exhaustifs** : Tous les cas de figure doivent être testés

---

## 🔄 STRATÉGIE DE ROLLBACK

### Si échec en Phase 2-3 (SQL)
```bash
# Restaurer le backup
mysql -u root -p neogenea < backup_pre_refactor_YYYYMMDD_HHMMSS.sql
```

### Si échec en Phase 4-5 (Backend)
```bash
# Revenir au commit précédent
git reset --hard pre-refactor
git checkout main
```

### Si bugs en production
1. **Rollback immédiat** : restaurer backup SQL
2. **Rollback code** : déployer version précédente
3. **Analyse post-mortem** : identifier cause
4. **Correction** : sur branche dédiée
5. **Re-déploiement** : après tests complets

---

## ✅ CHECKLIST FINALE

### Avant de commencer
- [ ] Backup SQL complet effectué
- [ ] Backup dossier `uploads/` effectué
- [ ] Tag Git `pre-refactor` créé
- [ ] Branche `refactor/union-model` créée
- [ ] Environnement de test disponible

### Pendant le refactoring
- [ ] Tables `unions` et `union_children` créées
- [ ] Script de migration écrit et testé
- [ ] Modèle `Union.js` créé
- [ ] `treeController.js` modifié
- [ ] Routes API `/api/unions` créées
- [ ] Frontend adapté

### Avant mise en production
- [ ] Tous les tests passent
- [ ] Migration testée sur copie de production
- [ ] Documentation mise à jour
- [ ] Changelog créé
- [ ] Rollback plan validé
- [ ] Équipe informée

### Après déploiement
- [ ] Monitoring actif
- [ ] Tests smoke en production
- [ ] Vérification visuelle de l'arbre
- [ ] Backup post-migration effectué

---

## 📈 MÉTRIQUES DE SUCCÈS

### Critères de validation

1. **Intégrité des données**
   - ✅ 100% des personnes migrées
   - ✅ 100% des relations préservées
   - ✅ 0 enfant orphelin
   - ✅ 0 doublon

2. **Fonctionnalité**
   - ✅ Arbre généalogique s'affiche correctement
   - ✅ Tous les cas de figure gérés (remariage, parent seul, etc.)
   - ✅ Performance acceptable (< 2s pour arbre de 100 personnes)

3. **Code quality**
   - ✅ 0 erreur ESLint
   - ✅ 0 warning SQL
   - ✅ Code documenté
   - ✅ Tests passants

---

## 🎯 PROCHAINES ÉTAPES (après refactoring)

### Améliorations futures possibles

1. **Import/Export GEDCOM** (standard généalogie)
2. **Gestion avancée** : adoption, GPA, multi-parentalité
3. **Timeline visuelle** : chronologie des unions
4. **Statistiques** : durée moyenne des unions, etc.
5. **Recherche avancée** : par union, par période
6. **Permissions** : unions privées vs publiques

---

## 📞 SUPPORT

### En cas de problème

1. **Consulter** : `doc/TROUBLESHOOTING.md`
2. **Logs** : vérifier les logs SQL et Node.js
3. **Rollback** : suivre la procédure ci-dessus
4. **Contact** : ouvrir une issue sur le repo

---

## 🏁 CONCLUSION

Ce refactoring est **majeur** mais **nécessaire** pour l'évolution du projet.

**Temps estimé total** : 6-8 heures
**Complexité** : Élevée
**Impact** : Transformationnel

**Recommandation** : 
- ✅ Procéder par phases
- ✅ Tester chaque étape
- ✅ Ne pas hésiter à rollback si problème
- ✅ Documenter les anomalies rencontrées

---

**Êtes-vous prêt à démarrer le refactoring ?**

Si oui, commençons par la **Phase 1 : Préparation (Backup)** 🚀
