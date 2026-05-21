# Fonctionnalité d'Ajout Rapide de Proches

**Date** : 21 mai 2026  
**Version** : 2.1

## Vue d'ensemble

Ajout d'icônes interactives sur chaque carte de l'arbre généalogique permettant d'ajouter rapidement des proches (parents, enfants, frères/sœurs, conjoints).

## Fonctionnalités

### Icônes d'ajout

Chaque carte de personne affiche maintenant 4 icônes "+" cliquables :

1. **En haut à gauche** : Ajouter un parent
2. **En bas au centre** : Ajouter un enfant
3. **À gauche** : Ajouter un frère/sœur
4. **À droite** : Ajouter un(e) conjoint(e)

### Style des icônes

- Cercles gris semi-transparents
- Signe "+" blanc au centre
- Bordure grise
- Taille : 20px de diamètre

### Flux d'utilisation

1. **Clic sur une icône "+"**
   - Le mode édition doit être activé
   - L'application bascule vers la vue "Ajouter"
   - Le titre du formulaire indique le type de proche à ajouter
   - Un message d'information indique avec qui la relation sera créée

2. **Remplissage du formulaire**
   - Entrer les informations de la nouvelle personne
   - Télécharger une photo (optionnel)

3. **Enregistrement**
   - La personne est créée dans la base de données
   - La relation est automatiquement créée selon le type :
     - **Parent** : Relation "parent" (nouveau → existant)
     - **Enfant** : Relation "parent" (existant → nouveau)
     - **Frère/Sœur** : Relation "frere" (bidirectionnelle)
     - **Conjoint** : Union créée (type "mariage")
   - Retour automatique à la vue arbre
   - L'arbre est rechargé pour afficher la nouvelle personne

## Fichiers modifiés

### public/tree-canvas.js

**Fonction `drawNode()`** (lignes ~730-860)
- Ajout de 4 icônes "+" autour de chaque carte
- Stockage des bounds dans `person._addIconBounds` pour détection de clics

**Fonction `drawCompleteTreeFromPerson()`** (lignes ~1335-1375)
- Ajout de la détection de clics sur les icônes d'ajout
- Appel de `handleAddRelative()` lors du clic

### public/app.js

**Variables globales** (ligne 12)
```javascript
let addRelativeContext = null; // {personId, relationType}
```

**Nouvelle fonction `handleAddRelative()`** (lignes ~104-154)
- Vérifie le mode édition
- Stocke le contexte (personne + type de relation)
- Bascule vers la vue "Ajouter"
- Affiche un message d'information

**Fonction `savePerson()` modifiée** (lignes ~560-595)
- Détecte si `addRelativeContext` est défini
- Appelle `createRelationFromContext()` après création
- Retourne à la vue arbre au lieu de la liste

**Nouvelle fonction `createRelationFromContext()`** (lignes ~625-715)
- Crée la relation appropriée selon le type
- Pour les conjoints, crée une union au lieu d'une relation
- Gère les erreurs silencieusement

**Fonction `resetForm()` modifiée** (lignes ~746-762)
- Nettoie `addRelativeContext`
- Supprime le message d'information

## Types de relations créées

| Type de proche | Relation créée | person1_id | person2_id |
|----------------|----------------|------------|------------|
| Parent | `parent` | Nouveau | Existant |
| Enfant | `parent` | Existant | Nouveau |
| Frère/Sœur | `frere` | Existant | Nouveau |
| Conjoint | Union `mariage` | Existant | Nouveau |

## Sécurité

- Les icônes ne sont actives que si le **mode édition est activé**
- Message explicite si l'utilisateur tente d'ajouter sans activer le mode édition
- Validation côté serveur pour toutes les opérations

## Améliorations futures possibles

1. **Sélection du sexe automatique**
   - Pour frère/sœur, pré-sélectionner le sexe approprié

2. **Héritage d'informations**
   - Nom de famille hérité pour les enfants
   - Proposition de dates approximatives

3. **Unions multiples**
   - Pour les enfants, proposer de sélectionner l'union parente si plusieurs conjoints

4. **Annulation contextuelle**
   - Bouton "Annuler" qui retourne à l'arbre au lieu de la liste

5. **Confirmation visuelle**
   - Animation de zoom sur la nouvelle personne après création

## Compatibilité

- Fonctionne avec le modèle Union (refactor v2.0)
- Compatible avec toutes les fonctionnalités existantes
- Pas de migration de base de données nécessaire

## Tests recommandés

1. Ajouter un parent à une personne existante
2. Ajouter un enfant à une personne mariée
3. Ajouter un frère/sœur dans une fratrie
4. Ajouter un second conjoint (remariage)
5. Vérifier que les relations s'affichent correctement après rechargement
6. Tester l'annulation du formulaire (nettoyage du contexte)

## Références

- Issue : Demande d'ajout d'icônes comme MyHeritage.fr
- Modèle de référence : MyHeritage.com
- Documentation Union : `doc/REFACTORING_COMPLETE.md`
