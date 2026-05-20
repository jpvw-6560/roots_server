# NeoGenea - Version 2.1 - Nouvelles Améliorations

## 📷 Upload de Photos

### Fonctionnalité
Ajout d'une zone d'upload de photo dans le formulaire d'ajout/modification de personne.

### Comment ça marche

#### 1. Interface d'Upload
- **Emplacement** : En haut du formulaire (avant les champs nom/prénom)
- **Prévisualisation** : Zone circulaire de 150x150px
- **Par défaut** : Icône 📷 quand aucune photo
- **Avec photo** : Aperçu de l'image uploadée ou existante

#### 2. Contrôles
- **Bouton "📁 Choisir une photo"** : Ouvre le sélecteur de fichiers
- **Bouton "🗑️ Retirer"** : Supprime la photo sélectionnée (apparaît uniquement si une photo est présente)
- **Formats acceptés** : JPG, PNG, GIF
- **Taille maximale** : 5 Mo

#### 3. Fonctionnement

##### Ajout d'une nouvelle personne avec photo
1. Ouvrir le formulaire d'ajout (➕ Ajouter)
2. Cliquer sur "📁 Choisir une photo"
3. Sélectionner une image depuis votre ordinateur
4. La photo s'affiche en prévisualisation
5. Remplir les autres champs (nom, prénom, etc.)
6. Cliquer sur "💾 Enregistrer"
7. La personne ET la photo sont sauvegardées

##### Modification d'une personne avec photo
1. Ouvrir le détail d'une personne
2. Cliquer sur "✏️ Modifier"
3. La photo actuelle s'affiche (si elle existe)
4. Options :
   - Garder la photo actuelle : Ne rien faire
   - Changer la photo : Cliquer sur "📁 Choisir une photo"
   - Retirer la photo : Cliquer sur "🗑️ Retirer"
5. Enregistrer les modifications

#### 4. Backend
- **Endpoint** : `POST /api/medias/upload`
- **Paramètres** :
  - `file` : Le fichier image
  - `person_id` : ID de la personne
  - `type_media` : "photo"
  - `description` : "Photo de profil"
  - `principale` : true (définit comme photo principale)
- **Stockage** : Dossier `uploads/`

#### 5. Affichage
La photo uploadée devient automatiquement la **photo principale** et s'affiche :
- Dans les cartes de la liste
- Dans le tableau
- Dans le détail de la personne
- Dans l'arbre généalogique

---

## 🌳 Arbre Généalogique avec Liaisons Visuelles

### Fonctionnalité
Ajout de connexions visuelles (lignes) entre les parents et leurs enfants dans l'arbre généalogique.

### Rendu Visuel

#### Avant (Version 2.0)
```
[Génération 1]
  [Henri DUBOIS]  [Jeanne MARTIN]

[Génération 2]
  [Pierre DUBOIS]  [Marie DUBOIS]  [Jean DUBOIS]
```
❌ Pas de lien visuel entre les générations

#### Maintenant (Version 2.1)
```
[Génération 1]
  [Henri DUBOIS]  [Jeanne MARTIN]
       |              |
       |______________|
            |    |    |
   _________|    |    |_________
   |             |              |
[Pierre]      [Marie]        [Jean]
```
✅ Lignes courbes reliant les parents aux enfants

### Implémentation Technique

#### 1. Structure HTML
```html
<div class="tree-container">
  <!-- SVG pour les connexions (en arrière-plan) -->
  <svg id="tree-connections" class="tree-connections"></svg>
  
  <!-- Contenu de l'arbre (au premier plan) -->
  <div id="tree-content" class="tree-content">
    <!-- Générations et personnes -->
  </div>
</div>
```

#### 2. SVG pour les Liaisons
- **Élément** : `<svg>` absolu couvrant tout le container
- **Position** : `z-index: 1` (arrière-plan)
- **Contenu** : `z-index: 2` (premier plan)
- **Lignes** : Courbes de Bézier (path SVG)

#### 3. Algorithme de Dessin
```javascript
function drawTreeConnections(generations, relations) {
  // Pour chaque génération (sauf la dernière)
  // Pour chaque personne (parent)
    // Trouver ses enfants dans les relations
    // Pour chaque enfant
      // Calculer position du parent (x1, y1)
      // Calculer position de l'enfant (x2, y2)
      // Dessiner une courbe de Bézier de (x1, y1) à (x2, y2)
}
```

#### 4. Calcul des Positions
- **getBoundingClientRect()** : Position absolue de chaque node dans le viewport
- **Coordonnées relatives** : Conversion par rapport au container
- **Points de connexion** :
  - Parent : Centre bas (bottom center)
  - Enfant : Centre haut (top center)

#### 5. Style des Lignes
- **Couleur** : #4a9d4f (vert primary-light)
- **Épaisseur** : 2px
- **Opacité** : 0.6 (60%)
- **Type** : Courbe de Bézier cubique
- **Formule** : `M x1 y1 C x1 midY, x2 midY, x2 y2`
  - M : Move to (point de départ)
  - C : Cubic Bézier curve
  - midY : Point de contrôle au milieu vertical

#### 6. Gestion du Zoom
- **Problème** : Les connexions doivent être redessinées après un zoom
- **Solution** : 
  - Sauvegarder les données de l'arbre dans `treeData` global
  - Après chaque zoom, redessiner les connexions
  - Délai de 100ms pour laisser le DOM se mettre à jour

```javascript
function applyTreeZoom() {
  // Appliquer le scale CSS
  container.style.transform = `scale(${treeZoomLevel})`;
  
  // Redessiner les connexions
  setTimeout(() => {
    drawTreeConnections(treeData.generations, treeData.relations);
  }, 100);
}
```

#### 7. Types de Relations Affichées
- **Parent → Enfant** : Ligne descendante
- **Enfant → Parent** : Convertie en Parent → Enfant
- **Autres relations** : Non affichées dans l'arbre (conjoints, frères/sœurs)

### Exemple de Génération

#### Famille Dubois (18 personnes, 5 générations)

```
                     [Henri DUBOIS] ────── [Jeanne MARTIN]
                            |
          __________________|__________________
          |                 |                 |
     [Pierre]           [Marie]           [Jean]
          |                 |                 |
    ______|_____       _____|_____       _____|_____
    |    |    |       |     |     |     |     |     |
  [Luc][Sophie][...]  [...]  [...]  [...]  [...]  [...]
```

---

## 🎨 Améliorations CSS

### Zone d'Upload Photo
```css
.photo-upload-section {
  background: var(--background);
  padding: 20px;
  border-radius: 12px;
}

.photo-preview {
  width: 150px;
  height: 150px;
  border: 3px dashed var(--border);
  border-radius: 50%;
  overflow: hidden;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Container de l'Arbre avec SVG
```css
.tree-container {
  position: relative;
  /* Permet le positionnement absolu du SVG */
}

.tree-connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Les clics passent au travers */
  z-index: 1;
}

.tree-content {
  position: relative;
  z-index: 2; /* Au-dessus du SVG */
}
```

---

## 📊 Flux de Données

### Upload de Photo
```
1. Utilisateur sélectionne une image
   ↓
2. JavaScript valide (type + taille)
   ↓
3. FileReader affiche la prévisualisation
   ↓
4. Image stockée dans currentPhotoFile (variable globale)
   ↓
5. Utilisateur clique sur "💾 Enregistrer"
   ↓
6. savePerson() sauvegarde la personne
   ↓
7. uploadPhoto() envoie l'image via FormData
   ↓
8. Backend (multer) stocke l'image dans uploads/
   ↓
9. Base de données enregistre le chemin
   ↓
10. Photo affichée partout où la personne apparaît
```

### Génération de l'Arbre avec Connexions
```
1. generateCompleteTree() récupère les personnes et relations
   ↓
2. findRootPeople() identifie les racines (sans parents)
   ↓
3. buildCompleteTreeByGenerations() construit l'arbre par niveaux
   ↓
4. Sauvegarde dans treeData (global)
   ↓
5. renderCompleteTree() génère le HTML avec IDs uniques
   ↓
6. setTimeout 100ms (attente du rendu DOM)
   ↓
7. applyTreeZoom() applique le niveau de zoom
   ↓
8. drawTreeConnections() calcule et dessine les lignes SVG
   ↓
9. Pour chaque parent-enfant :
   - getBoundingClientRect() des deux nodes
   - Calcul des coordonnées x1,y1 → x2,y2
   - Création d'un path SVG avec courbe de Bézier
   - Ajout au SVG
```

---

## 🧪 Tests à Effectuer

### Test Upload Photo

#### Test 1 : Ajout avec photo
- [ ] Activer le mode édition (🔓)
- [ ] Cliquer sur "➕ Ajouter"
- [ ] Cliquer sur "📁 Choisir une photo"
- [ ] Sélectionner une image JPG de 2 Mo
- [ ] Vérifier la prévisualisation
- [ ] Remplir les champs obligatoires
- [ ] Enregistrer
- [ ] Vérifier que la photo apparaît dans la liste

#### Test 2 : Modification avec changement de photo
- [ ] Cliquer sur une personne avec photo
- [ ] Cliquer sur "✏️ Modifier"
- [ ] Vérifier que la photo actuelle s'affiche
- [ ] Cliquer sur "📁 Choisir une photo"
- [ ] Sélectionner une nouvelle image
- [ ] Enregistrer
- [ ] Vérifier que la nouvelle photo remplace l'ancienne

#### Test 3 : Retrait de photo
- [ ] Modifier une personne avec photo
- [ ] Cliquer sur "🗑️ Retirer"
- [ ] Vérifier que l'icône 📷 réapparaît
- [ ] Enregistrer
- [ ] Vérifier que la personne n'a plus de photo

#### Test 4 : Validation des contraintes
- [ ] Essayer d'uploader un fichier PDF → Message d'erreur
- [ ] Essayer d'uploader une image de 10 Mo → Message d'erreur
- [ ] Uploader une image PNG de 1 Mo → Succès

### Test Arbre avec Connexions

#### Test 1 : Génération de l'arbre
- [ ] Ouvrir la vue "🌳 Arbre"
- [ ] Vérifier que les 5 générations s'affichent
- [ ] Vérifier que des lignes vertes relient les générations
- [ ] Vérifier que les lignes partent du centre bas des parents
- [ ] Vérifier que les lignes arrivent au centre haut des enfants

#### Test 2 : Style des lignes
- [ ] Les lignes sont courbes (pas droites)
- [ ] Couleur verte (#4a9d4f)
- [ ] Épaisseur de 2px
- [ ] Légère transparence (60%)

#### Test 3 : Connexions correctes
- [ ] Henri DUBOIS → Pierre, Marie, Jean (3 lignes)
- [ ] Jeanne MARTIN → Pierre, Marie, Jean (3 lignes)
- [ ] Pierre DUBOIS → Ses enfants
- [ ] Etc. pour toutes les relations parent-enfant

#### Test 4 : Zoom avec connexions
- [ ] Cliquer sur "🔍+ Zoom +"
- [ ] Vérifier que les lignes suivent les nodes
- [ ] Cliquer plusieurs fois jusqu'à zoom max
- [ ] Les lignes doivent rester connectées
- [ ] Cliquer sur "🔍− Zoom -"
- [ ] Les lignes se redessinent correctement
- [ ] Cliquer sur "↻ Reset"
- [ ] Retour au zoom 100% avec lignes correctes

#### Test 5 : Scroll et connexions
- [ ] Scroller l'arbre verticalement
- [ ] Vérifier que les lignes restent fixes avec le contenu
- [ ] Scroller horizontalement (si nécessaire)
- [ ] Les lignes suivent le contenu

---

## 📝 Code Ajouté/Modifié

### Fichiers Modifiés
1. **public/index.html**
   - Ajout de la section photo-upload dans le formulaire
   - Restructuration du tree-container avec SVG

2. **public/style.css**
   - Styles pour .photo-upload-section
   - Styles pour .photo-preview
   - Styles pour .tree-connections (SVG)
   - Ajustement .tree-container avec position relative

3. **public/app.js**
   - Variables globales : currentPhotoFile, currentPhotoUrl, treeData
   - Fonction initPhotoUpload()
   - Fonction removePhoto()
   - Fonction displayCurrentPhoto()
   - Fonction uploadPhoto()
   - Modification savePerson() pour gérer l'upload
   - Modification editPerson() pour afficher la photo
   - Modification resetForm() pour réinitialiser la photo
   - Modification generateCompleteTree() pour sauvegarder treeData
   - Modification renderCompleteTree() pour ajouter des IDs aux nodes
   - Fonction drawTreeConnections() (nouvelle)
   - Modification applyTreeZoom() pour redessiner les connexions

### Lignes de Code
- **Ajoutées** : ~250 lignes
- **Modifiées** : ~50 lignes
- **Total** : ~300 lignes de code

---

## 🚀 Déploiement

Aucune modification backend nécessaire. Les endpoints existants sont déjà fonctionnels :
- ✅ `POST /api/medias/upload` (déjà implémenté avec multer)
- ✅ `GET /api/persons/:id` (retourne photo_principale)
- ✅ `GET /api/relations` (retourne toutes les relations)

### Redémarrage du Serveur
```bash
cd ~/Documents/node_appli/roots_server
pkill -f "node.*server.js"
node src/server.js
```

### Accès
```
http://localhost:3007
```

---

## 📚 Documentation Utilisateur

### Pour Ajouter une Photo de Profil

1. **Activer le mode édition** (toggle en haut à droite)
2. **Créer ou modifier une personne**
3. **Cliquer sur "📁 Choisir une photo"** en haut du formulaire
4. **Sélectionner une image** depuis votre ordinateur
5. **Vérifier la prévisualisation** (aperçu circulaire)
6. **Remplir/modifier les autres champs**
7. **Enregistrer**

La photo apparaîtra automatiquement dans :
- Les cartes de la liste
- Le tableau
- Le détail de la personne
- L'arbre généalogique

### Pour Comprendre l'Arbre Généalogique

L'arbre affiche toute votre famille organisée par générations avec des **lignes de connexion** :

- **Lignes vertes** : Relient les parents à leurs enfants
- **Générations** : Numérotées de 1 (ancêtres) à N (descendants)
- **Zoom** : Utilisez les boutons 🔍+ et 🔍− pour ajuster la taille
- **Navigation** : Cliquez sur une personne pour voir son détail

Les lignes vous permettent de **visualiser rapidement** :
- Qui sont les parents de qui
- Combien d'enfants a chaque personne
- La structure complète de la famille

---

**Version** : 2.1  
**Date** : 19 Mai 2026  
**Nouvelles fonctionnalités** : Upload de photos + Arbre avec liaisons visuelles  
**Compatibilité** : 100% avec version 2.0
