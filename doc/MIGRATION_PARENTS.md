# Migration vers la table `parents`

## 📋 Vue d'ensemble

Cette migration simplifie la structure de la base de données en remplaçant les tables `unions` et `union_children` par une seule table `parents` avec une référence directe dans `persons`.

## 🔄 Changements

### Ancienne structure
```
unions (person1_id, person2_id, date_debut, date_fin, lieu)
  ↓
union_children (union_id, child_id, ordre_naissance)
  ↓
persons
```

### Nouvelle structure  
```
parents (id, id_pere, id_mere, date_mariage, lieu_mariage, date_divorce)
  ↑
persons (id, ..., id_parents)
```

## ✅ Avantages

1. **Plus simple** : 1 table au lieu de 2
2. **Plus clair** : père et mère explicites
3. **Fratrie automatique** : même `id_parents` = même fratrie
4. **Moins de jointures** : une seule référence

## 📝 Étapes de migration

### 1. Backup de la base de données

```bash
mysqldump -u root -p neogenea > backup_avant_migration_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Exécuter le script de migration

```bash
mysql -u root -p neogenea < scripts/migration-to-parents-table.sql
```

Le script effectue automatiquement :
- ✅ Création de la table `parents`
- ✅ Ajout de la colonne `id_parents` dans `persons`
- ✅ Migration des données de `unions` → `parents`
- ✅ Migration des données de `union_children` → `persons.id_parents`
- ✅ Renommage des anciennes tables en `*_OLD` (backup)

### 3. Redémarrer le serveur

```bash
cd /home/jpvw/Documents/node_appli/roots_server
npm start
```

### 4. Tester l'API

```bash
# Récupérer tous les couples
curl http://localhost:3007/api/parents

# Récupérer tous les couples avec enfants
curl http://localhost:3007/api/parents/with-children

# Récupérer l'arbre complet
curl http://localhost:3007/api/tree
```

### 5. Tester le frontend

1. Ouvrir http://localhost:3007/
2. Aller dans l'onglet "🌳 Arbre"
3. Sélectionner une personne
4. Cliquer sur "📄 Export JSON"
5. Vérifier la structure dans la console (F12)

## 🆕 Nouveaux fichiers

### Backend
- `models/Parent.js` - Model pour la table parents
- `controllers/parentController.js` - Controller pour les parents
- `routes/parents.js` - Routes API pour les parents
- `scripts/migration-to-parents-table.sql` - Script de migration SQL

### Frontend
- `public/tree-canvas-v3.js` - Nouvelle version utilisant la structure parents

### Modifications
- `models/Person.js` - Ajout du champ `id_parents`
- `controllers/treeController.js` - Utilisation de la nouvelle structure
- `src/server.js` - Ajout des routes parents

## 📊 Nouvelle API

### GET /api/parents
Récupère tous les couples de parents

**Réponse :**
```json
[
  {
    "id": 1,
    "id_pere": 25,
    "id_mere": 33,
    "date_mariage": "1990-06-15",
    "lieu_mariage": "Paris",
    "date_divorce": null,
    "pere_prenom": "Jean",
    "pere_nom": "Dupont",
    "mere_prenom": "Marie",
    "mere_nom": "Martin"
  }
]
```

### GET /api/parents/with-children
Récupère tous les couples avec leurs enfants

**Réponse :**
```json
[
  {
    "id": 1,
    "id_pere": 25,
    "id_mere": 33,
    "pere": { "id": 25, "prenom": "Jean", "nom": "Dupont" },
    "mere": { "id": 33, "prenom": "Marie", "nom": "Martin" },
    "children": [
      { "id": 50, "prenom": "Paul", "nom": "Dupont" },
      { "id": 51, "prenom": "Sophie", "nom": "Dupont" }
    ]
  }
]
```

### GET /api/parents/:id
Récupère un couple par ID avec ses enfants

### GET /api/parents/child/:childId
Récupère les parents d'une personne

### POST /api/parents
Crée un nouveau couple

**Body :**
```json
{
  "id_pere": 25,
  "id_mere": 33,
  "date_mariage": "1990-06-15",
  "lieu_mariage": "Paris"
}
```

### POST /api/parents/find-or-create
Trouve ou crée un couple

### PUT /api/parents/:id
Met à jour un couple

### DELETE /api/parents/:id
Supprime un couple

## 🔧 Modification d'une personne

Lors de la création/modification d'une personne, ajouter le champ `id_parents` :

```json
{
  "prenom": "Paul",
  "nom": "Dupont",
  "sexe": "M",
  "id_parents": 1
}
```

## 🎯 Structure JSON de l'arbre (V3)

```json
{
  "version": 3,
  "totalGroupes": 5,
  "groupes": [
    {
      "id": 1,
      "parents": null,
      "type": "union",
      "parent_id": 1,
      "members": [
        { "id_personne": 25, "name": "Jean Dupont" },
        { "id_personne": 33, "name": "Marie Martin", "statut": "épouse" }
      ]
    },
    {
      "id": 2,
      "parents": 1,
      "type": "fratrie",
      "pere_id": 25,
      "mere_id": 33,
      "members": [
        { "id_personne": 50, "name": "Paul Dupont" },
        { "reference_groupe": 3 }
      ]
    }
  ]
}
```

## 🔙 Rollback (si problème)

```sql
-- Restaurer les anciennes tables
RENAME TABLE unions_OLD TO unions;
RENAME TABLE union_children_OLD TO union_children;

-- Supprimer les modifications
ALTER TABLE persons DROP FOREIGN KEY persons_ibfk_X; -- remplacer X
ALTER TABLE persons DROP COLUMN id_parents;
DROP TABLE parents;
```

Ou restaurer le backup complet :
```bash
mysql -u root -p neogenea < backup_avant_migration_YYYYMMDD_HHMMSS.sql
```

## 📌 Notes importantes

- Les anciennes tables sont renommées `unions_OLD` et `union_children_OLD` (pas supprimées)
- Les enfants sans parents auront `id_parents = NULL`
- La suppression d'un couple met `id_parents` à NULL pour les enfants
- Les fratries sont automatiques : même `pere_id` + `mere_id` = même fratrie

## ✨ Prochaines étapes

1. ✅ Migration SQL terminée
2. ✅ Models et controllers créés
3. ✅ Routes ajoutées
4. ✅ tree-canvas-v3.js créé
5. ⏳ Implémenter le positionnement des nœuds dans tree-canvas-v3.js
6. ⏳ Implémenter le dessin du canvas dans tree-canvas-v3.js
7. ⏳ Mettre à jour le frontend pour utiliser tree-canvas-v3.js
8. ⏳ Supprimer les anciennes tables `unions_OLD` et `union_children_OLD`
