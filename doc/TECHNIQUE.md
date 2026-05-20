# Détails techniques - NeoGenea

## Architecture

NeoGenea suit le pattern **MVC (Model-View-Controller)** :

```
┌──────────────────────────────────────┐
│          FRONTEND (View)             │
│  HTML + CSS + JavaScript vanilla     │
└────────────┬─────────────────────────┘
             │ HTTP/JSON
             │
┌────────────▼─────────────────────────┐
│       API REST (Controller)          │
│      Express.js Routes               │
└────────────┬─────────────────────────┘
             │
┌────────────▼─────────────────────────┐
│     BUSINESS LOGIC (Model)           │
│     Controllers + Models             │
└────────────┬─────────────────────────┘
             │
┌────────────▼─────────────────────────┐
│          DATABASE                    │
│          MySQL                       │
└──────────────────────────────────────┘
```

## Stack technique

### Backend

- **Node.js** : Runtime JavaScript
- **Express.js** : Framework web
- **mysql2** : Driver MySQL avec support des Promises
- **multer** : Gestion des uploads de fichiers
- **dotenv** : Gestion des variables d'environnement
- **cors** : Gestion du Cross-Origin Resource Sharing

### Frontend

- **HTML5** : Structure
- **CSS3** : Styles (variables CSS, grid, flexbox)
- **JavaScript ES6+** : Logique (async/await, fetch API)
- **Responsive Design** : Compatible mobile et desktop

### Base de données

- **MySQL 5.7+** : Base de données relationnelle
- **Charset** : utf8mb4 (support complet Unicode)
- **Engine** : InnoDB (support des transactions et clés étrangères)

## Structure des fichiers

```
roots_server/
│
├── config/
│   ├── database.js          # Configuration et pool MySQL
│   └── config.js            # Configuration générale
│
├── models/
│   ├── Person.js            # Modèle des personnes
│   ├── Relation.js          # Modèle des relations
│   └── Media.js             # Modèle des médias
│
├── controllers/
│   ├── personController.js  # Logique métier personnes
│   ├── relationController.js # Logique métier relations
│   ├── mediaController.js   # Logique métier médias
│   └── treeController.js    # Génération d'arbres
│
├── routes/
│   ├── persons.js           # Routes API personnes
│   ├── relations.js         # Routes API relations
│   ├── medias.js            # Routes API médias
│   └── tree.js              # Routes API arbres
│
├── src/
│   └── server.js            # Serveur principal
│
├── public/
│   ├── index.html           # Interface utilisateur
│   ├── style.css            # Styles
│   └── app.js               # Logique frontend
│
├── uploads/                 # Fichiers uploadés (créé automatiquement)
│
├── doc/                     # Documentation
│   ├── DEMARRAGE.md
│   ├── UTILISATION.md
│   └── TECHNIQUE.md
│
├── package.json             # Dépendances Node.js
├── .env                     # Configuration (non versionné)
├── .env.example             # Exemple de configuration
├── .gitignore               # Fichiers à ignorer
├── README.md                # Documentation principale
└── start.txt                # Guide de démarrage rapide
```

## Modèle de données

### Table `persons`

Stocke les informations sur chaque personne.

```sql
CREATE TABLE persons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100),
  nom_jeune_fille VARCHAR(100),
  sexe ENUM('M', 'F', 'Autre') NOT NULL,
  date_naissance DATE,
  lieu_naissance VARCHAR(255),
  date_deces DATE,
  lieu_deces VARCHAR(255),
  biographie TEXT,
  photo_principale VARCHAR(255),
  vivant BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Table `relations`

Stocke les relations entre personnes.

```sql
CREATE TABLE relations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  person1_id INT NOT NULL,
  person2_id INT NOT NULL,
  type_relation ENUM('parent', 'enfant', 'conjoint', 'frere', 'soeur') NOT NULL,
  date_debut DATE,
  date_fin DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (person1_id) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (person2_id) REFERENCES persons(id) ON DELETE CASCADE
);
```

**Note** : Les relations sont bidirectionnelles. Créer une relation "parent" crée automatiquement la relation "enfant" réciproque.

### Table `medias`

Stocke les photos et documents.

```sql
CREATE TABLE medias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  person_id INT NOT NULL,
  type_media ENUM('photo', 'document', 'video', 'audio', 'acte') NOT NULL,
  chemin_fichier VARCHAR(255) NOT NULL,
  miniature VARCHAR(255),
  description TEXT,
  date_media DATE,
  taille_fichier INT,
  principale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE
);
```

### Table `familles`

Groupement optionnel de familles.

```sql
CREATE TABLE familles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom_famille VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API REST

### Endpoints Personnes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/persons` | Liste toutes les personnes |
| GET | `/api/persons/:id` | Détail d'une personne |
| GET | `/api/persons/search?q=terme` | Recherche |
| POST | `/api/persons` | Créer une personne |
| PUT | `/api/persons/:id` | Modifier une personne |
| DELETE | `/api/persons/:id` | Supprimer une personne |
| GET | `/api/persons/:id/parents` | Parents d'une personne |
| GET | `/api/persons/:id/children` | Enfants d'une personne |
| GET | `/api/persons/:id/spouses` | Conjoints d'une personne |

### Endpoints Relations

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/relations` | Liste toutes les relations |
| GET | `/api/relations/:id` | Détail d'une relation |
| POST | `/api/relations` | Créer une relation |
| PUT | `/api/relations/:id` | Modifier une relation |
| DELETE | `/api/relations/:id` | Supprimer une relation |
| GET | `/api/relations/person/:personId` | Relations d'une personne |

### Endpoints Arbre

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/tree/:personId` | Génère l'arbre d'une personne |
| GET | `/api/tree` | Arbre complet (toutes personnes) |
| GET | `/api/tree/stats/all` | Statistiques globales |

**Paramètres pour `/api/tree/:personId`** :
- `type` : `both` (défaut), `ancestors`, `descendants`
- `generations` : Nombre de générations (défaut : 3)

Exemple : `/api/tree/5?type=ancestors&generations=4`

### Endpoints Médias

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/medias` | Liste tous les médias |
| GET | `/api/medias/:id` | Détail d'un média |
| GET | `/api/medias/person/:personId` | Médias d'une personne |
| POST | `/api/medias/upload` | Upload un fichier |
| PUT | `/api/medias/:id` | Modifier un média |
| PATCH | `/api/medias/:id/principal` | Définir comme photo principale |
| DELETE | `/api/medias/:id` | Supprimer un média |

## Gestion des relations réciproques

Lors de la création d'une relation, le système crée automatiquement la relation inverse :

- `parent` ↔ `enfant`
- `conjoint` ↔ `conjoint`

Exemple :
```javascript
// Créer : Jean est parent de Pierre
POST /api/relations
{
  "person1_id": 1,  // Jean
  "person2_id": 2,  // Pierre
  "type_relation": "parent"
}

// Crée automatiquement : Pierre est enfant de Jean
```

## Algorithme de génération d'arbre

La génération d'arbre utilise un parcours récursif avec :
- Protection contre les cycles (via `visited Set`)
- Limite de générations configurable
- Relations hiérarchiques (parents → enfants)

```javascript
async function buildAncestorsTree(personId, generations, currentGen, visited) {
  if (currentGen >= generations || visited.has(personId)) {
    return null;
  }
  
  visited.add(personId);
  
  const person = await Person.getById(personId);
  const parents = await Person.getParents(personId);
  
  const node = {
    ...person,
    parents: []
  };
  
  for (const parent of parents) {
    const parentTree = await buildAncestorsTree(
      parent.id, 
      generations, 
      currentGen + 1, 
      visited
    );
    if (parentTree) node.parents.push(parentTree);
  }
  
  return node;
}
```

## Performance

### Optimisations implémentées

- **Pool de connexions MySQL** : Réutilisation des connexions
- **Index sur colonnes fréquemment recherchées** (nom, prenom, dates)
- **Requêtes avec JOINs** pour limiter le nombre d'appels base
- **Cascade DELETE** : Suppression automatique des relations et médias

### Recommandations

Pour une généalogie de grande taille (>1000 personnes) :
- Augmenter `connectionLimit` dans `database.js`
- Ajouter un système de pagination sur la liste
- Implémenter un cache côté serveur (Redis)
- Optimiser les requêtes d'arbre avec une limite de générations

## Sécurité

**⚠️ Important** : Cette application est conçue pour un usage local sans exposition Internet.

Si vous souhaitez l'exposer publiquement, ajouter :
- Authentification (JWT, sessions)
- Validation stricte des entrées
- Protection CSRF
- Rate limiting
- HTTPS obligatoire

## Évolutions possibles

- [ ] Authentification multi-utilisateurs
- [ ] Export/Import GEDCOM
- [ ] Génération PDF d'arbres
- [ ] Carte géographique interactive
- [ ] Timeline familiale
- [ ] Reconnaissance OCR d'actes
- [ ] Notifications (anniversaires, etc.)
- [ ] Application mobile
- [ ] Vérification de doublons
- [ ] Statistiques avancées

## Logs et débogage

Les logs apparaissent dans la console du serveur :

```bash
npm start
# ou pour plus de détails
NODE_ENV=development npm start
```

Types de logs :
- ✅ Connexion base de données
- 📡 Démarrage serveur
- ❌ Erreurs SQL
- 🔍 Requêtes HTTP (en mode dev)
