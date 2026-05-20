# Principe de l'application : NeoGenea

## Objectif

Créer une application web d'arbre généalogique hébergée sur le serveur Nipogi.

L'application doit permettre :
- de gérer des personnes et leurs relations familiales,
- d'afficher un arbre généalogique interactif,
- de stocker photos et documents,
- de rechercher rapidement un membre,
- de gérer plusieurs familles si nécessaire,
- d'être accessible depuis le réseau local et éventuellement via Internet.

L'application sera développée en :
- Node.js
- HTML/CSS
- JavaScript
- Base de données SQL déjà disponible sur le serveur Nipogi

---

# Architecture générale

## Backend
Node.js + Express

Rôles :
- API REST
- accès base de données
- authentification
- gestion des médias
- génération de l'arbre

## Frontend
HTML + CSS + JavaScript vanilla ou framework léger.

Fonctions :
- affichage arbre
- formulaires
- recherche
- visualisation des fiches personnes

## Base de données

Tables principales :

### persons
Contient les personnes.

Champs :
- id
- nom
- prenom
- sexe
- date_naissance
- lieu_naissance
- date_deces
- lieu_deces
- biographie
- photo_principale
- created_at
- updated_at

### relations
Relations entre personnes.

Champs :
- id
- person1_id
- person2_id
- type_relation

Types possibles :
- parent
- enfant
- conjoint
- frère
- soeur

### medias
Documents associés.

Champs :
- id
- person_id
- type_media
- fichier
- description
- date_media

### users
Gestion des accès.

Champs :
- id
- login
- password_hash
- role

---

# Fonctionnalités principales

## Gestion des personnes
- ajouter
- modifier
- supprimer
- rechercher

## Gestion des relations
- parents
- enfants
- mariages
- divorces

## Affichage graphique
Afficher :
- ascendance
- descendance
- arbre complet

Fonctions :
- zoom
- déplacement
- recentrage

## Photos et documents
Importer :
- photos
- actes
- PDF
- vidéos éventuelles

## Recherche
Recherche par :
- nom
- prénom
- date
- lieu

## Sécurité
- login obligatoire
- rôles administrateur/utilisateur
- sauvegardes automatiques

---

# API REST

## Exemple endpoints

GET /api/persons

GET /api/persons/:id

POST /api/persons

PUT /api/persons/:id

DELETE /api/persons/:id

GET /api/tree/:id

---

# Affichage arbre généalogique

Étudier bibliothèques possibles :
- D3.js
- Treant.js
- FamilyTree.js

Objectif :
- affichage fluide
- responsive
- navigation intuitive

---

# Stockage des médias

Structure :
/data/genealogie/photos
/data/genealogie/documents

Prévoir :
- miniatures
- compression images
- sauvegardes

---

# Sauvegardes

Prévoir :
- export SQL
- export GEDCOM
- import GEDCOM

---

# Évolutions futures

## Possibilités
- carte géographique des ancêtres
- chronologie familiale
- statistiques
- reconnaissance des doublons
- OCR des actes anciens
- génération PDF d'arbres
- notifications anniversaires
- accès mobile

---

# Contraintes techniques

L'application doit :
- fonctionner sur Ubuntu serveur Nipogi
- être légère
- être autonome
- fonctionner sans cloud externe
- être accessible via navigateur web

---

# Structure projet

/genea-app
    /backend
    /frontend
    /uploads
    /database
    /backup
    server.js
    package.json

---

# Priorités de développement

## Phase 1
- structure serveur
- base SQL
- CRUD personnes
- login

## Phase 2
- relations familiales
- affichage arbre

## Phase 3
- médias
- GEDCOM

## Phase 4
- optimisation
- responsive
- export PDF

---

# Philosophie du projet

Application :
- simple
- rapide
- durable
- maintenable
- indépendante des services cloud
- adaptée à un usage familial sur serveur personnel