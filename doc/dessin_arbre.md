# Spécifications et Code : Dessiner un Arbre Généalogique Orienté avec HTML5 Canvas

Ce document sert de contexte et de base de code pour générer, modifier ou étendre un script de visualisation de graphe orienté structuré comme un arbre généalogique (parents vers enfants). Le rendu utilise l'API Canvas HTML5 standard (Vanilla JavaScript) sans dépendance externe.

---

## 1. Structure du Projet

L'application se compose d'un élément `<canvas>` pour le rendu visuel et d'un script JavaScript qui gère :
1. La structure de données (Nœuds et Liens).
2. L'algorithme de positionnement automatique par génération (`level`).
3. Le tracé de liens orthogonaux (en forme de "L" inversé).
4. Le dessin des cartes de membres (rectangles texturés).

### Fichier HTML (`index.html`)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Arbre Généalogique - Canvas API</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f6fa;
        }
        canvas {
            background-color: #ffffff;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
        }
    </style>
</head>
<body>

    <canvas id="treeCanvas" width="900" height="600"></canvas>

    <script src="app.js"></script>
</body>
</html>
```

---

## 2. Logique JavaScript (`app.js`)

Le script ci-dessous calcule dynamiquement la position `X` de chaque nœud au sein de sa génération pour éviter les chevauchements, puis applique un tracé orthogonal.

```javascript
const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');

// ==========================================
// 1. STRUCTURE DES DONNÉES (Graphe Orienté)
// ==========================================
const nodes = [
    { id: 'Grand-Père', level: 0 },
    { id: 'Père', level: 1 },
    { id: 'Oncle', level: 1 },
    { id: 'Fils 1', level: 2 },
    { id: 'Fils 2', level: 2 },
    { id: 'Cousin 1', level: 2 }
];

const links = [
    { from: 'Grand-Père', to: 'Père' },
    { from: 'Grand-Père', to: 'Oncle' },
    { from: 'Père', to: 'Fils 1' },
    { from: 'Père', to: 'Fils 2' },
    { from: 'Oncle', to: 'Cousin 1' }
];

// Config graphiques des nœuds
const nodeWidth = 110;
const nodeHeight = 45;
const rowHeight = 120; // Espace vertical entre chaque génération
const nodePadding = 30; // Espace horizontal minimum entre deux nœuds

// ==========================================
// 2. ALGORITHME DE POSITIONNEMENT AUTOMATIQUE
// ==========================================
const levels = {};

// Regrouper les nœuds par niveau/génération
nodes.forEach(node => {
    if (!levels[node.level]) levels[node.level] = [];
    levels[node.level].push(node);
});

// Calculer les coordonnées (X, Y) pour centrer chaque niveau
Object.keys(levels).forEach(level => {
    const levelNodes = levels[level];
    // Largeur totale occupée par cette génération
    const totalLevelWidth = levelNodes.length * nodeWidth + (levelNodes.length - 1) * nodePadding;
    // Point de départ X pour centrer la ligne dans le canvas
    const startX = (canvas.width - totalLevelWidth) / 2;

    levelNodes.forEach((node, index) => {
        node.x = startX + index * (nodeWidth + nodePadding);
        node.y = 50 + level * rowHeight; // Alignement vertical basé sur le niveau
    });
});

// ==========================================
// 3. FONCTIONS DE TRACÉ GRAPHIQUE (Canvas)
// ==========================================

/**
 * Dessine un lien orienté orthogonal (angles droits) avec flèche pointant vers le bas
 */
function drawOrthogonalLink(ctx, fromNode, toNode) {
    const startX = fromNode.x + nodeWidth / 2;
    const startY = fromNode.y + nodeHeight;
    const endX = toNode.x + nodeWidth / 2;
    const endY = toNode.y;

    // Calcul du point d'inflexion vertical (milieu de la distance)
    const midY = startY + (endY - startY) / 2;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, midY); // Descente verticale initiale
    ctx.lineTo(endX, midY);   // Ligne horizontale vers l'axe de la cible
    ctx.lineTo(endX, endY);   // Descente verticale finale vers l'enfant
    
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dessin de la pointe de la flèche (triangle pointant vers le bas)
    const arrowSize = 6;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - arrowSize, endY - arrowSize * 1.5);
    ctx.lineTo(endX + arrowSize, endY - arrowSize * 1.5);
    ctx.closePath();
    ctx.fillStyle = '#7f8c8d';
    ctx.fill();
}

/**
 * Fonction principale de rendu de l'arbre
 */
function drawTree() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Étape A : Dessiner les liens en premier (arrière-plan)
    links.forEach(link => {
        const fromNode = nodes.find(n => n.id === link.from);
        const toNode = nodes.find(n => n.id === link.to);
        if (fromNode && toNode) {
            drawOrthogonalLink(ctx, fromNode, toNode);
        }
    });

    // Étape B : Dessiner les nœuds (premier plan)
    nodes.forEach(node => {
        // Rectangle de la carte du membre
        ctx.fillStyle = '#3498db';
        ctx.fillRect(node.x, node.y, nodeWidth, nodeHeight);
        
        // Bordure du nœud
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 2;
        ctx.strokeRect(node.x, node.y, nodeWidth, nodeHeight);

        // Texte / Label du nœud
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.id, node.x + nodeWidth / 2, node.y + nodeHeight / 2);
    });
}

// Lancement du rendu initial
drawTree();
```

---

## 3. Prompts Utiles pour Copilot

Voici des instructions ciblées que vous pouvez donner à Copilot à partir de ce fichier :

*   **Ajouter des données :** *"Modifie le tableau `nodes` et `links` pour ajouter une troisième génération avec 4 enfants supplémentaires et rééquilibre le calcul des positions X."*
*   **Gestion des conjoints :** *"Adapte l'algorithme de positionnement et la fonction `drawOrthogonalLink` pour permettre d'avoir des nœuds 'Conjoints' fusionnés ou côte à côte partageant les mêmes enfants."*
*   **Interactivité :** *"Ajoute un écouteur d'événement `click` sur le canvas pour détecter sur quel nœud l'utilisateur a cliqué et afficher son ID dans la console."*
*   **Style Visuel :** *"Modifie le rendu des nœuds dans `drawTree` pour afficher des rectangles aux coins arrondis et ajouter une ombre portée."*
