# Guide d'utilisation - NeoGenea

## Vue d'ensemble

NeoGenea est une application web de gestion d'arbres généalogiques. Elle permet de :

- ✅ Gérer les personnes de votre famille
- ✅ Créer des relations familiales (parents, enfants, conjoints, etc.)
- ✅ Visualiser l'arbre généalogique
- ✅ Ajouter des photos et documents
- ✅ Rechercher rapidement une personne

## Interface utilisateur

### Navigation principale

L'application comporte 4 sections principales :

1. **📋 Liste** : Affiche toutes les personnes enregistrées
2. **🌳 Arbre** : Visualise l'arbre généalogique
3. **➕ Ajouter** : Formulaire pour ajouter/modifier une personne
4. **🔍 Rechercher** : Recherche rapide par nom, prénom ou lieu

### Ajouter une personne

1. Cliquer sur le bouton "➕ Ajouter" dans la navigation
2. Remplir le formulaire :
   - **Nom** (obligatoire)
   - **Prénom**
   - **Nom de jeune fille** (pour les femmes mariées)
   - **Sexe** (obligatoire)
   - **Dates et lieux** de naissance/décès
   - **Biographie** (texte libre)
   - Cocher "Personne vivante" si applicable
3. Cliquer sur "💾 Enregistrer"

### Consulter une fiche personne

1. Dans la liste ou les résultats de recherche, cliquer sur une carte personne
2. La fiche détaillée affiche :
   - Photo principale (si ajoutée)
   - Informations personnelles
   - Relations familiales
   - Biographie
   - Médias associés

### Actions sur une personne

Depuis la fiche détaillée :

- **✏️ Modifier** : Éditer les informations
- **🔗 Ajouter relation** : Créer un lien familial
- **🗑️ Supprimer** : Supprimer la personne (avec confirmation)

### Créer des relations

1. Ouvrir la fiche d'une personne
2. Cliquer sur "🔗 Ajouter relation"
3. Dans la fenêtre modale :
   - Sélectionner la personne liée
   - Choisir le type de relation :
     - **Parent** : Cette personne est parent de...
     - **Enfant** : Cette personne est enfant de...
     - **Conjoint** : Mariage ou union
     - **Frère/Sœur** : Fratrie
   - Ajouter les dates (début/fin pour les unions)
4. Valider

**Note** : Les relations réciproques sont créées automatiquement (exemple : si A est parent de B, alors B devient automatiquement enfant de A).

### Visualiser l'arbre généalogique

1. Aller dans l'onglet "🌳 Arbre"
2. Sélectionner une personne comme point de départ
3. Choisir le type d'arbre :
   - **Ascendants et descendants** : Arbre complet
   - **Ascendants** : Parents, grands-parents, etc.
   - **Descendants** : Enfants, petits-enfants, etc.
4. Cliquer sur "Générer l'arbre"

### Rechercher

1. Aller dans l'onglet "🔍 Rechercher"
2. Taper au moins 2 caractères
3. La recherche se fait dans :
   - Noms
   - Prénoms
   - Lieux de naissance
4. Cliquer sur une carte pour voir les détails

### Ajouter des photos/documents

**Note** : La fonctionnalité d'upload de médias est accessible via l'API. L'interface web sera enrichie dans une prochaine version.

Pour l'instant, vous pouvez utiliser un outil comme Postman ou curl :

```bash
curl -X POST http://localhost:3007/api/medias/upload \
  -F "file=@/chemin/vers/photo.jpg" \
  -F "person_id=1" \
  -F "type_media=photo" \
  -F "principale=true" \
  -F "description=Photo de famille"
```

## Conseils d'utilisation

### Ordre recommandé

1. **Commencer par vous-même** : Créez votre propre fiche
2. **Ajouter vos parents** puis créer les relations
3. **Remonter les générations** progressivement
4. **Ajouter la fratrie** et les conjoints
5. **Descendre les générations** (enfants, petits-enfants)

### Bonnes pratiques

- ✅ **Saisir les dates au format AAAA-MM-JJ** pour une cohérence
- ✅ **Utiliser le nom de jeune fille** pour les femmes mariées
- ✅ **Ajouter les lieux complets** (ville, pays)
- ✅ **Rédiger des biographies** pour enrichir l'arbre
- ✅ **Vérifier les relations** avant de valider

### Gestion des décès

- Décocher "Personne vivante"
- Renseigner la date et le lieu de décès
- La personne apparaîtra différemment dans les listes

## Statistiques

En haut de la page, vous pouvez voir en temps réel :
- Nombre total de personnes
- Nombre de relations créées
- Nombre de médias uploadés

## Support

Pour toute question ou problème :
- Consulter les fichiers de documentation dans `doc/`
- Vérifier les logs du serveur dans le terminal
- Consulter l'API : http://localhost:3007/api/health
