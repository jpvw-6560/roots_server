# correctif.md
# Refactor complet du moteur généalogique

Version : 2.0  
Objectif : transformer un modèle simple "Person → Children" en modèle robuste "Person → Union → Children"

---

# 1. CONTEXTE DU PROJET

Tu développes une application d’arbre généalogique sur un serveur personnel (Node.js + HTML + SQL).

Le modèle actuel est fonctionnel mais simplifié :
- une personne a des enfants directement
- les conjoints sont gérés à part
- les relations sont implicites

Ce modèle devient rapidement insuffisant pour une vraie généalogie.

---

# 2. PROBLÈME FONDAMENTAL DU MODÈLE ACTUEL

## 2.1 Modèle actuel


Person → Children
Person → Spouse (séparé)


## 2.2 Problèmes concrets

### ❌ 1. Ambiguïté parentale
Impossible de savoir :
- quel enfant appartient à quel couple
- quelle union est responsable d’une naissance

### ❌ 2. Familles recomposées impossibles à modéliser proprement
Exemple :

Marc + Sophie → Alice  
Marc + Julie → Hugo

Le modèle actuel donne :


Marc
├── Alice
└── Hugo


=> faux généalogiquement

---

### ❌ 3. Conjoints dissociés des enfants
Le lien logique couple → enfant est perdu.

---

### ❌ 4. Impossible d’étendre proprement
- adoptions
- enfants hors mariage
- parents inconnus
- GPA / situations complexes
- GEDCOM import/export

---

### ❌ 5. Problème graphique majeur
Les arbres deviennent :
- croisés
- illisibles
- non déterministes

---

# 3. OBJECTIF DU NOUVEAU MODÈLE

Passer à une structure standard utilisée dans les logiciels généalogiques :


Person → Union → Children


---

# 4. IDÉE CENTRALE : L’UNION COMME ENTITÉ

## 4.1 Concept

Une union est une entité indépendante :
- mariage
- concubinage
- PACS
- union libre

Elle relie 2 personnes et produit des enfants.

---

## 4.2 Modèle logique


Person
↓
Union
↓
Children


---

# 5. AVANTAGES DU NOUVEAU MODÈLE

## ✅ 5.1 Modélisation correcte des familles

Chaque enfant est rattaché :
- à UNE union
- donc à UN couple

---

## ✅ 5.2 Gestion des familles complexes

- remariages
- demi-frères
- familles recomposées
- enfants multiples unions

---

## ✅ 5.3 Compatibilité GEDCOM

GEDCOM repose implicitement sur :
- individus
- unions
- relations parentales

---

## ✅ 5.4 Graphes propres et sans ambiguïté

Plus de croisements inutiles :
- chaque couple est un nœud logique
- enfants groupés proprement

---

## ✅ 5.5 Extensibilité

Permet facilement :
- adoption
- parent inconnu
- GPA
- multi-parentalité étendue

---

## ❌ 5.6 Inconvénients

### ❌ 1. Complexité initiale plus élevée
Plus de tables :
- persons
- unions
- union_children

---

### ❌ 2. Refactor backend nécessaire
Tous les endpoints doivent évoluer

---

### ❌ 3. Frontend plus complexe
L’arbre devient :
- Person → Union nodes → Children

---

### ❌ 4. Plus de requêtes SQL
JOIN supplémentaires

---

# 6. MODÈLE SQL FINAL

---

## 6.1 persons

```sql
CREATE TABLE persons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    sexe ENUM('M','F','X'),
    date_naissance DATE,
    date_deces DATE,
    photo_principale VARCHAR(255)
);
6.2 unions
CREATE TABLE unions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    partner1_id INT NOT NULL,
    partner2_id INT NULL,

    type_union ENUM(
        'mariage',
        'concubinage',
        'pacse',
        'union_libre'
    ),

    date_debut DATE,
    date_fin DATE,

    FOREIGN KEY (partner1_id) REFERENCES persons(id),
    FOREIGN KEY (partner2_id) REFERENCES persons(id)
);
6.3 union_children
CREATE TABLE union_children (
    union_id INT,
    child_id INT,

    PRIMARY KEY (union_id, child_id),

    FOREIGN KEY (union_id) REFERENCES unions(id),
    FOREIGN KEY (child_id) REFERENCES persons(id)
);
7. MODÈLE LOGIQUE BACKEND
Ancien modèle
Person.getChildren()
Person.getSpouses()
Nouveau modèle
Union.getByPerson()
Union.getChildren()
Union.getSpouse()
8. MODÈLE JSON FINAL
8.1 Ancien format
{
  "id": 1,
  "children": []
}
8.2 Nouveau format (standard)
{
  "id": 1,
  "nom": "Marc",
  "prenom": "Dupont",

  "unions": [
    {
      "id": 10,

      "type_union": "mariage",

      "spouse": {
        "id": 2,
        "nom": "Sophie",
        "prenom": "Martin"
      },

      "children": [
        {
          "id": 5,
          "prenom": "Alice"
        }
      ]
    }
  ]
}
9. REFONTE treeController.js
9.1 Changement clé

Remplacer :

Person.getChildren()
Person.getSpouses()

par :

Union.getByPerson()
9.2 Nouvelle structure de buildDescendantsTree
const unions = await Union.getByPerson(personId);

node.unions = [];

for (const union of unions) {

    const spouse = await Union.getSpouse(union.id, personId);

    const children = await Union.getChildren(union.id);

    const childrenTree = [];

    for (const child of children) {
        childrenTree.push(
            await buildDescendantsTree(child.id, ...)
        );
    }

    node.unions.push({
        id: union.id,
        type_union: union.type_union,
        spouse,
        children: childrenTree
    });
}
10. MODÈLE Union.js
class Union {

    static getByPerson(personId) {}

    static getChildren(unionId) {}

    static getSpouse(unionId, currentPersonId) {}

    static create() {}

    static addChild() {}

}
11. REPRÉSENTATION GRAPHIQUE
❌ Faux
Marc
 ├── Alice
 └── Hugo
✅ Correct
Marc ─ Sophie
      │
    Alice

Marc ─ Julie
      │
     Hugo
12. CONCEPT CRUCIAL : UNION NODE

Chaque union devient un nœud logique :

Person → UnionNode → Children

Même si invisible graphiquement.

13. CAS COMPLEXES GÉRÉS
13.1 Remariage

OK

13.2 Demi-frères

OK

13.3 Parent inconnu

partner2_id = NULL

13.4 Adoption (future extension)

type_filiation

14. API FUTURE
GET /persons
GET /persons/:id
GET /unions/:id
GET /tree/:id
POST /unions
POST /unions/:id/children
15. FRONTEND

Utiliser :

D3.js (recommandé)
ou
FamilyTree.js
16. PLAN DE MIGRATION
Étape 1

Créer tables :

unions
union_children
Étape 2

Créer modèle :

Union.js
Étape 3

Modifier controller :

treeController.js
Étape 4

Adapter frontend

Étape 5

Migration progressive des données

17. STRUCTURE FINALE PROJET
/genea-app
  /backend
    /controllers
    /models
      Person.js
      Union.js
    /routes

  /frontend

  /uploads
  /backup
  server.js
18. CONCLUSION

Le modèle :

Person → Union → Children

est :

le standard des logiciels généalogiques
le seul modèle scalable
le seul modèle sans ambiguïté

Le modèle actuel doit être considéré comme :

prototype
insuffisant pour cas réels

---