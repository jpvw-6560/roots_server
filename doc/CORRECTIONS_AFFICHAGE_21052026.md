# CORRECTIONS AFFICHAGE ARBRE - 21 mai 2026

## Problèmes identifiés

1. **Imbrication des cartes** : Les cartes de parents, maris et femmes étaient imbriquées au lieu d'être visibles entièrement
2. **Remariages** : L'affichage des remariages multiples (ex: Jean-Pol avec Michelle et Olga) n'était pas clair
3. **Grands-parents** : Les grands-parents et leurs fratries n'étaient pas bien affichés

## Corrections apportées

### 1. Positionnement des conjoints

**AVANT** :
- Conjoints décalés verticalement (`spouseVerticalOffset: 30`)
- Position calculée : `centerX + horizontalSpacing` (incorrect)
- Résultat : chevauchement et imbrication

**APRÈS** :
- Conjoints au même niveau Y (`spouseVerticalOffset: 0`)
- Position calculée correctement : 
  - Personne : `coupleStartX`
  - Conjoint : `coupleStartX + nodeWidth + horizontalSpacing`
- Résultat : cartes côte à côte, visibles entièrement

### 2. Espacement amélioré

```javascript
// Nouvelles valeurs
horizontalSpacing: 50,      // Entre conjoints (↑ de 30 à 50)
siblingSpacing: 120,        // Entre frères/sœurs (↑ de 100 à 120)
generationSpacing: 200,     // Entre générations (↑ de 180 à 200)
marriageSpacing: 150,       // Espace entre unions multiples (nouveau)
```

### 3. Fonction positionNodes réécrite

**Principes** :
1. Calculer la largeur du couple (personne + conjoint + espacement)
2. Centrer le couple sur centerX
3. Placer la personne à gauche, le conjoint à droite
4. Même Y pour les deux (pas de décalage vertical)

**Logique simplifiée** :
```javascript
const coupleWidth = node.spouse ?
  TREE_CONFIG.nodeWidth * 2 + TREE_CONFIG.horizontalSpacing :
  TREE_CONFIG.nodeWidth;

const coupleStartX = centerX - coupleWidth / 2;
node.person.x = coupleStartX;
node.person.y = y;

if (node.spouse) {
  node.spouse.x = coupleStartX + TREE_CONFIG.nodeWidth + TREE_CONFIG.horizontalSpacing;
  node.spouse.y = y; // Même Y !
}
```

### 4. Gestion des fratries

- Calcul de la largeur totale de la fratrie
- Recentrage du nœud central
- Positionnement séquentiel de chaque sibling
- Tous les siblings au même niveau Y
- Conjoints des siblings également gérés

### 5. Liens entre conjoints

**AVANT** : Ligne en escalier (horizontale → verticale → horizontale)
**APRÈS** : Ligne horizontale simple avec symbole 💍 au centre

### 6. Mariages multiples

Pour Jean-Pol (2 mariages) :
- Chaque union affichée séparément
- Espace `marriageSpacing` entre les unions
- Enfants correctement associés à chaque union

## Structure visuelle attendue

```
Génération -2:  [Grand-père] — [Grand-mère]
                       |
Génération -1:       [Père] — [Mère]    [Oncle] — [Tante]
                       |
Génération 0:   [Personne] — [Conjoint]  [Frère] — [Épouse]
                  |                          |
Génération +1:  [Enfant1]  [Enfant2]     [Neveu]


Cas remariages (Jean-Pol) :

Génération 0:   [Jean-Pol] — [Michelle]     [Jean-Pol] — [Olga]
                     |                            |
Génération +1:   [Yohan] [Gaël] [Eve]        [François] [Célia]
```

## Tests à effectuer

1. ✅ Vérifier que les cartes ne se chevauchent plus
2. ⏳ Tester l'affichage de Jean-Pol avec ses 2 mariages
3. ⏳ Vérifier l'affichage des grands-parents et leurs fratries
4. ⏳ Tester le zoom et le scroll sur l'arbre
5. ⏳ Vérifier les clics sur les cartes et l'icône 🌳

## Fichiers modifiés

- `public/tree-canvas.js` :
  - TREE_CONFIG : ajustement des espacements
  - `positionNodes()` : réécriture complète
  - `drawTreeLinks()` : simplification des connexions

## Prochaines améliorations possibles

1. Ajouter un mode "compact" pour les arbres très larges
2. Améliorer la visualisation des remariages (ligne verticale entre les 2 unions ?)
3. Ajouter des légendes pour expliquer les symboles
4. Permettre de personnaliser les espacements dans l'interface

## Notes

- Les unions sont gérées via le modèle Union (refactoring du 20 mai)
- La base de données utilise les tables `unions` et `union_children`
- Compatibilité maintenue avec les anciennes relations `parent` et `frere`
