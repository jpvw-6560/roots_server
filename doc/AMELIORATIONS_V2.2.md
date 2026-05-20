# NeoGenea - Version 2.2 - Arbre Professionnel & Orthographe

## 📝 Corrections Orthographiques

### Problème
L'application affichait "Vivant(e)" et "Décédé(e)" avec le "(e)" générique, alors que nous connaissons le sexe de chaque personne.

### Solution
Création de fonctions utilitaires qui retournent le texte correct selon le sexe :

#### Fonctions Ajoutées
```javascript
function getStatusText(person) {
  if (person.vivant) {
    return person.sexe === 'F' ? 'Vivante' : 'Vivant';
  } else {
    return person.sexe === 'F' ? 'Décédée' : 'Décédé';
  }
}

function getStatusTextWithIcon(person) {
  if (person.vivant) {
    return person.sexe === 'F' ? '✅ Vivante' : '✅ Vivant';
  } else {
    return person.sexe === 'F' ? '🕊️ Décédée' : '🕊️ Décédé';
  }
}
```

### Résultat

#### Avant
- Homme : "Vivant(e)" / "Décédé(e)"
- Femme : "Vivant(e)" / "Décédé(e)"

#### Maintenant
- Homme : "Vivant" / "Décédé"
- Femme : "Vivante" / "Décédée"

### Endroits Corrigés
1. **Vue Liste (Cartes)** : `${getStatusText(person)}`
2. **Vue Liste (Tableau)** : `${getStatusTextWithIcon(person)}`
3. **Vue Détail** : `${getStatusTextWithIcon(person)}`
4. **Vue Recherche** : `${getStatusText(person)}`

---

## 🌳 Arbre Généalogique Professionnel

### Objectif
Créer un arbre généalogique avec des liaisons visuelles structurées, similaire aux logiciels professionnels de généalogie (MyHeritage, Ancestry, etc.).

### Améliorations des Connexions

#### Avant (Version 2.1)
- Courbes de Bézier entre chaque parent et enfant individuellement
- Pas de distinction visuelle entre types de relations
- Lignes qui se croisaient parfois

#### Maintenant (Version 2.2)
- **Lignes droites** (verticales et horizontales)
- **Structure en T inversé** pour les familles
- **Lignes entre conjoints** (pointillées horizontales)
- **Groupement familial** intelligent

### Architecture des Connexions

#### 1. Lignes entre Conjoints
- **Type** : Ligne horizontale pointillée
- **Couleur** : Marron (#8b4513) - couleur secondaire
- **Épaisseur** : 2px
- **Style** : `stroke-dasharray: 5,5`
- **Position** : Relie les conjoints au même niveau

```
[Parent 1] -------- [Parent 2]
               (ligne pointillée)
```

#### 2. Lignes Parents → Enfants

##### Structure en T inversé
```
    [Parent 1] -------- [Parent 2]
          |
          | (ligne verticale du centre des parents)
          |
    ______|______
    |     |     |
    |     |     | (lignes verticales vers chaque enfant)
 [Enfant1] [Enfant2] [Enfant3]
```

##### Algorithme
1. **Calculer le centre des parents** (moyenne des positions X)
2. **Ligne verticale** du bas des parents jusqu'au milieu
3. **Ligne horizontale** au milieu reliant tous les enfants
4. **Lignes verticales** du milieu vers chaque enfant

##### Code
```javascript
// 1. Ligne verticale depuis les parents
svg.appendChild(createLine(parentCenterX, parentBottomY, parentCenterX, midY));

// 2. Ligne horizontale entre enfants (si plusieurs)
if (childNodes.length > 1) {
  svg.appendChild(createLine(leftMostChild, midY, rightMostChild, midY));
}

// 3. Lignes verticales vers chaque enfant
childNodes.forEach(childNode => {
  svg.appendChild(createLine(childX, midY, childX, childY));
});
```

### Groupement Familial Intelligent

#### Problème
Avec l'ancien système, si deux parents avaient les mêmes enfants, les lignes étaient dessinées deux fois.

#### Solution
- **Groupement par famille** : Les enfants avec les mêmes parents sont groupés
- **Clé unique** : `children.sort().join('-')`
- **Une seule structure** de lignes par famille

```javascript
const familyGroups = new Map();
gen.people.forEach(parent => {
  const children = parentChildMap.get(parent.id) || [];
  const familyKey = children.sort().join('-');
  
  if (!familyGroups.has(familyKey)) {
    familyGroups.set(familyKey, {
      parents: [],
      children: children
    });
  }
  familyGroups.get(familyKey).parents.push(parent.id);
});
```

### Styles des Lignes

#### Lignes Parent-Enfant
- **Couleur** : Vert foncé (#2c5f2d) - couleur primaire
- **Épaisseur** : 2.5px
- **Opacité** : 0.7 (70%)
- **Type** : Lignes droites
- **Terminaisons** : Arrondies (`stroke-linecap: round`)

#### Lignes Conjoints
- **Couleur** : Marron (#8b4513) - couleur secondaire
- **Épaisseur** : 2px
- **Opacité** : 0.7 (70%)
- **Type** : Pointillée (5px tiret, 5px espace)

---

## 🎨 Améliorations CSS de l'Arbre

### Espacement des Générations
```css
.tree-generation {
  margin: 60px 0; /* Augmenté de 30px à 60px */
  padding: 20px;
}
```
- Plus d'espace vertical entre générations
- Meilleure lisibilité des connexions

### Espacement des Cartes
```css
.tree-persons {
  gap: 40px; /* Augmenté de 15px à 40px */
  padding: 20px 0;
}
```
- Plus d'espace horizontal entre personnes
- Évite les superpositions de lignes

### Style des Cartes (Nodes)
```css
.tree-node {
  min-width: 200px;
  max-width: 220px;
  box-shadow: 0 2px 8px var(--shadow);
  position: relative;
}

.tree-node:hover {
  transform: translateY(-3px); /* Au lieu de scale(1.05) */
  box-shadow: 0 6px 16px var(--shadow);
  border-color: var(--primary-dark);
}
```
- Largeur fixe pour uniformité
- Effet de levée au survol (plus naturel)
- Meilleure ombre

### Conteneur de l'Arbre
```css
.tree-zoom-level {
  padding-bottom: 50px; /* Évite le cut-off en bas */
}

.tree-connections line {
  stroke-linecap: round; /* Terminaisons arrondies */
}
```

---

## 📊 Comparaison Visuelle

### Structure Familiale Exemple

#### Henri DUBOIS + Jeanne MARTIN → 3 enfants

```
         [Henri DUBOIS] -------- [Jeanne MARTIN]
                    |
                    |
         ___________|___________
         |          |          |
         |          |          |
    [Pierre]    [Marie]     [Jean]
```

#### Avec l'Ancien Système (Version 2.1)
```
   [Henri]            [Jeanne]
      \                  /
       \                /
        \              /
         [Pierre]  [Marie]  [Jean]
    (courbes qui se croisent)
```

#### Avec le Nouveau Système (Version 2.2)
```
   [Henri] -------- [Jeanne]
            |
      ______|______
      |     |     |
   [Pierre] [Marie] [Jean]
    (structure claire en T)
```

---

## 🔧 Détails Techniques

### Calcul des Positions

#### Position Centrale des Parents
```javascript
let parentCenterX = 0;
parentNodes.forEach(node => {
  const rect = node.getBoundingClientRect();
  parentCenterX += (rect.left + rect.width / 2 - containerRect.left);
});
parentCenterX /= parentNodes.length;
```

#### Position Centrale des Enfants
```javascript
let childrenCenterX = 0;
childNodes.forEach(node => {
  const rect = node.getBoundingClientRect();
  childrenCenterX += (rect.left + rect.width / 2 - containerRect.left);
});
childrenCenterX /= childNodes.length;
```

#### Point Intermédiaire
```javascript
const midY = parentBottomY + (childrenTopY - parentBottomY) / 2;
```
- À mi-chemin entre la génération des parents et celle des enfants
- Permet d'avoir des lignes symétriques

### Gestion du Zoom

Les connexions sont redessinées après chaque zoom :

```javascript
function applyTreeZoom() {
  container.style.transform = `scale(${treeZoomLevel})`;
  
  setTimeout(() => {
    if (treeData.generations && treeData.relations) {
      drawTreeConnections(treeData.generations, treeData.relations);
    }
  }, 100);
}
```

Le délai de 100ms permet au DOM de se mettre à jour avant de recalculer les positions.

---

## 🧪 Tests à Effectuer

### Test Orthographe

#### Personnes Masculines
- [ ] Ouvrir le détail d'Henri DUBOIS
- [ ] Vérifier "🕊️ Décédé" (sans "e")
- [ ] Ouvrir la liste, vérifier les cartes "Décédé"
- [ ] Vérifier le tableau "🕊️ Décédé"

#### Personnes Féminines
- [ ] Ouvrir le détail de Jeanne MARTIN
- [ ] Vérifier "🕊️ Décédée" (avec "e")
- [ ] Ouvrir la liste, vérifier les cartes "Décédée"
- [ ] Vérifier le tableau "🕊️ Décédée"

#### Personnes Vivantes
- [ ] Trouver une personne vivante masculine (ex: Lucas DUBOIS)
- [ ] Vérifier "✅ Vivant"
- [ ] Trouver une personne vivante féminine (ex: Emma DUBOIS)
- [ ] Vérifier "✅ Vivante"

### Test Arbre avec Connexions Professionnelles

#### Structure Visuelle
- [ ] Ouvrir la vue "🌳 Arbre"
- [ ] Vérifier que les générations sont espacées (~60px)
- [ ] Vérifier que les personnes sont espacées (~40px)
- [ ] Les cartes ont une largeur uniforme (200-220px)

#### Lignes entre Conjoints
- [ ] Henri DUBOIS ↔ Jeanne MARTIN : Ligne horizontale pointillée marron
- [ ] Pierre DUBOIS ↔ Sophie LAURENT : Ligne horizontale pointillée marron
- [ ] Toutes les lignes de conjoints sont au même niveau vertical

#### Lignes Parents-Enfants (Structure en T)
- [ ] Henri/Jeanne → Pierre/Marie/Jean :
  - Ligne verticale du centre des parents vers le bas
  - Ligne horizontale reliant les 3 enfants
  - 3 lignes verticales montant vers chaque enfant
- [ ] Pierre/Sophie → Leurs enfants : Même structure en T
- [ ] Toutes les lignes sont droites (pas de courbes)

#### Style des Lignes
- [ ] Lignes parent-enfant : Vert foncé, 2.5px, pleines
- [ ] Lignes conjoints : Marron, 2px, pointillées
- [ ] Terminaisons arrondies
- [ ] Opacité à 70%

#### Zoom avec Connexions
- [ ] Cliquer sur "🔍+ Zoom +"
- [ ] Les lignes suivent les cartes
- [ ] Les connexions restent correctes
- [ ] Tester zoom jusqu'à 200%
- [ ] Cliquer sur "🔍− Zoom -"
- [ ] Les lignes se redessinent correctement
- [ ] Tester jusqu'à 50%
- [ ] Reset à 100%

#### Familles Multiples
- [ ] Génération 1 : Henri + Jeanne → 3 enfants
  - Une seule structure en T (pas de doublon)
- [ ] Génération 2 : Pierre + Sophie → Leurs enfants
  - Structure en T distincte et claire

#### Pas de Croisements
- [ ] Vérifier qu'aucune ligne ne se croise
- [ ] Les lignes horizontales sont au même niveau par génération
- [ ] Les lignes verticales sont bien alignées avec les cartes

---

## 📝 Code Modifié

### Fichiers Modifiés

1. **public/app.js**
   - Ajout : `getStatusText(person)` (15 lignes)
   - Ajout : `getStatusTextWithIcon(person)` (10 lignes)
   - Modification : 4 endroits utilisant le statut
   - Réécriture complète : `drawTreeConnections()` (~150 lignes)
   - **Total** : ~180 lignes modifiées/ajoutées

2. **public/style.css**
   - Modification : `.tree-generation` (espacement)
   - Modification : `.tree-persons` (gap augmenté)
   - Modification : `.tree-node` (largeur, hover)
   - Modification : `.tree-zoom-level` (padding-bottom)
   - Ajout : `.tree-connections line` (terminaisons)
   - **Total** : ~40 lignes modifiées

### Lignes de Code
- **Ajoutées** : ~190 lignes
- **Modifiées** : ~50 lignes
- **Total** : ~240 lignes

---

## 🚀 Déploiement

### Aucun Changement Backend
Toutes les modifications sont uniquement frontend (HTML/CSS/JS).

### Redémarrage
Le serveur tourne déjà. Si besoin de redémarrer :
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

## 🎓 Guide Utilisateur

### Lecture de l'Arbre

#### Lignes Vertes (Pleines)
= Relation parent-enfant
- Ligne verticale depuis les parents
- Ligne horizontale entre frères/sœurs
- Lignes verticales vers chaque enfant

#### Lignes Marron (Pointillées)
= Relation conjugale
- Ligne horizontale entre conjoints
- Permet de voir les couples

#### Statuts Corrects
- **Hommes** : "Vivant" ou "Décédé"
- **Femmes** : "Vivante" ou "Décédée"
- Plus de "(e)" générique !

### Navigation
1. **Voir l'arbre complet** : Vue "🌳 Arbre"
2. **Zoomer** : Boutons 🔍+ et 🔍−
3. **Cliquer sur une personne** : Affiche son détail
4. **Suivre les lignes** : Comprendre les liens familiaux

---

## 📚 Références

### Inspiration
- MyHeritage Family Tree
- Ancestry Tree View
- Logiciels de généalogie professionnels

### Standards de Représentation
- **Lignes droites** : Plus lisibles que les courbes
- **Structure en T** : Standard pour représenter les familles
- **Lignes distinctes** : Différencier conjoints vs parents-enfants
- **Espacement généreux** : Éviter les chevauchements

---

**Version** : 2.2  
**Date** : 19 Mai 2026  
**Améliorations** :
- ✅ Orthographe correcte selon le sexe (Vivant/Vivante, Décédé/Décédée)
- ✅ Arbre avec connexions professionnelles (lignes droites en T)
- ✅ Lignes entre conjoints (pointillées)
- ✅ Meilleur espacement et disposition
- ✅ Structure familiale claire et lisible

**Compatibilité** : 100% avec versions précédentes
