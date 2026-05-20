/**
 * Module Canvas pour l'arbre généalogique
 * Basé sur les spécifications de doc/dessin_arbre.md
 */

// Configuration graphique
const TREE_CONFIG = {
  nodeWidth: 200,
  nodeHeight: 100,
  rowHeight: 120,
  horizontalSpacing: 30,  // Espace entre conjoints
  familySpacing: 80,      // Espace entre familles (frères/sœurs)
  generationSpacing: 140, // Espace vertical entre générations
  parentPlaceholderHeight: 80, // Hauteur des placeholders de parents
  fontSize: 13,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  colors: {
    nodeBg: '#ffffff',
    nodeBorder: '#2c5f2d',
    nodeText: '#333333',
    linkColor: '#d0d0d0',      // Gris clair pour les liens
    conjointLink: '#d0d0d0',   // Gris pour ligne conjoints
    maleBorder: '#4A90E2',     // Bleu pour bordure hommes
    femaleBorder: '#E91E63',   // Rose pour bordure femmes
    male: '#f0f8ff',           // Bleu très clair
    female: '#fff0f5',         // Rose très clair
    placeholder: '#f9f9f9',
    placeholderBorder: '#dddddd',
    statusAlive: '#4CAF50',    // Vert pour vivant
    statusDeceased: '#999999'  // Gris pour décédé
  }
};

/**
 * Construire la structure d'arbre familial par familles
 */
function buildFamilyTree(people, relations) {
  console.log('buildFamilyTree - Personnes:', people.length, 'Relations:', relations.length);
  
  // Maps pour accès rapide
  const childrenMap = new Map(); // parent_id -> [child_ids]
  const spouseMap = new Map();   // person_id -> spouse_id
  const parentsMap = new Map();  // child_id -> [parent_ids]
  
  relations.forEach(rel => {
    if (rel.type_relation === 'parent') {
      if (!childrenMap.has(rel.person1_id)) childrenMap.set(rel.person1_id, []);
      childrenMap.get(rel.person1_id).push(rel.person2_id);
      
      if (!parentsMap.has(rel.person2_id)) parentsMap.set(rel.person2_id, []);
      parentsMap.get(rel.person2_id).push(rel.person1_id);
    } else if (rel.type_relation === 'enfant') {
      if (!childrenMap.has(rel.person2_id)) childrenMap.set(rel.person2_id, []);
      childrenMap.get(rel.person2_id).push(rel.person1_id);
      
      if (!parentsMap.has(rel.person1_id)) parentsMap.set(rel.person1_id, []);
      parentsMap.get(rel.person1_id).push(rel.person2_id);
    } else if (rel.type_relation === 'conjoint') {
      spouseMap.set(rel.person1_id, rel.person2_id);
      spouseMap.set(rel.person2_id, rel.person1_id);
    }
  });
  
  // Trouver les personnes racines (sans parents)
  const roots = people.filter(p => !parentsMap.has(p.id) || parentsMap.get(p.id).length === 0);
  console.log('Racines trouvées:', roots.length, roots.map(r => `${r.prenom} ${r.nom}`));
  
  if (roots.length === 0) {
    console.warn('Aucune racine trouvée, utilisation de la personne la plus âgée');
    // Prendre la personne la plus âgée
    const oldest = people.sort((a, b) => {
      const dateA = a.date_naissance ? new Date(a.date_naissance) : new Date('2000-01-01');
      const dateB = b.date_naissance ? new Date(b.date_naissance) : new Date('2000-01-01');
      return dateA - dateB;
    })[0];
    if (oldest) roots.push(oldest);
  }
  
  const visited = new Set();
  const families = [];
  
  // Fonction récursive pour construire une famille
  function buildFamily(person, level = 0) {
    if (visited.has(person.id)) return null;
    visited.add(person.id);
    
    const spouseId = spouseMap.get(person.id);
    const spouse = spouseId && !visited.has(spouseId) ? 
      people.find(p => p.id === spouseId) : null;
    
    if (spouse) visited.add(spouse.id);
    
    const family = {
      parents: spouse ? [person, spouse] : [person],
      children: [],
      level: level,
      width: 0,
      x: 0,
      y: TREE_CONFIG.parentPlaceholderHeight + level * (TREE_CONFIG.nodeHeight + TREE_CONFIG.generationSpacing),
      hasParentPlaceholders: level === 0
    };
    
    // Récupérer les enfants (communs ou d'un seul parent)
    const childIds = new Set([
      ...(childrenMap.get(person.id) || []),
      ...(spouse ? (childrenMap.get(spouse.id) || []) : [])
    ]);
    
    childIds.forEach(childId => {
      if (!visited.has(childId)) {
        const child = people.find(p => p.id === childId);
        if (child) {
          const childFamily = buildFamily(child, level + 1);
          if (childFamily) {
            family.children.push(childFamily);
          }
        }
      }
    });
    
    return family;
  }
  
  // Construire les familles racines
  roots.forEach(root => {
    const family = buildFamily(root, 0);
    if (family) {
      console.log(`Famille construite pour ${root.prenom} ${root.nom}:`, 
        `${family.parents.length} parents, ${family.children.length} enfants`);
      families.push(family);
    }
  });
  
  console.log('Total familles racines construites:', families.length);
  return families;
}

/**
 * Calculer la largeur nécessaire pour chaque famille (bottom-up)
 */
function calculateFamilyWidths(family) {
  if (family.children.length === 0) {
    // Famille sans enfant : largeur = parents côte à côte
    let width = family.parents.length * TREE_CONFIG.nodeWidth + 
                   (family.parents.length - 1) * TREE_CONFIG.horizontalSpacing;
    
    // Si c'est une famille racine, ajouter de l'espace pour les placeholders
    if (family.hasParentPlaceholders) {
      // Chaque parent a 2 placeholders au-dessus (père et mère)
      // On a besoin d'espace pour : placeholder père, parent, placeholder mère
      width = Math.max(width, family.parents.length * (TREE_CONFIG.nodeWidth * 3 + 20));
    }
    
    family.width = width;
    return family.width;
  }
  
  // Calculer récursivement la largeur des enfants
  let childrenTotalWidth = 0;
  family.children.forEach((child, index) => {
    calculateFamilyWidths(child);
    childrenTotalWidth += child.width;
    if (index < family.children.length - 1) {
      childrenTotalWidth += TREE_CONFIG.familySpacing;
    }
  });
  
  // La largeur de la famille = max(largeur parents, largeur enfants)
  let parentsWidth = family.parents.length * TREE_CONFIG.nodeWidth + 
                       (family.parents.length - 1) * TREE_CONFIG.horizontalSpacing;
  
  // Si c'est une famille racine, ajouter de l'espace pour les placeholders
  if (family.hasParentPlaceholders) {
    parentsWidth = Math.max(parentsWidth, family.parents.length * (TREE_CONFIG.nodeWidth * 3 + 20));
  }
  
  family.width = Math.max(parentsWidth, childrenTotalWidth);
  return family.width;
}

/**
 * Positionner les familles (top-down)
 */
function positionFamily(family, startX, startY) {
  family.y = startY;
  
  // Position X du centre de la famille
  const centerX = startX + family.width / 2;
  
  // Positionner les parents (centrés)
  const parentsWidth = family.parents.length * TREE_CONFIG.nodeWidth + 
                       (family.parents.length - 1) * TREE_CONFIG.horizontalSpacing;
  let parentX = centerX - parentsWidth / 2;
  
  family.parents.forEach((parent, index) => {
    parent.x = parentX;
    parent.y = startY;
    parentX += TREE_CONFIG.nodeWidth + TREE_CONFIG.horizontalSpacing;
  });
  
  // Positionner les enfants
  if (family.children.length > 0) {
    const childrenY = startY + TREE_CONFIG.nodeHeight + TREE_CONFIG.generationSpacing;
    let childX = startX;
    
    // Centrer les enfants sous les parents
    let childrenTotalWidth = 0;
    family.children.forEach((child, index) => {
      childrenTotalWidth += child.width;
      if (index < family.children.length - 1) {
        childrenTotalWidth += TREE_CONFIG.familySpacing;
      }
    });
    
    childX = centerX - childrenTotalWidth / 2;
    
    family.children.forEach(child => {
      positionFamily(child, childX, childrenY);
      childX += child.width + TREE_CONFIG.familySpacing;
    });
  }
}

/**
 * Calculer les positions pour toutes les familles
 */
function calculateNodePositions(families, canvasWidth) {
  // Calculer les largeurs
  let totalWidth = 0;
  families.forEach((family, index) => {
    calculateFamilyWidths(family);
    totalWidth += family.width;
    if (index < families.length - 1) {
      totalWidth += TREE_CONFIG.familySpacing * 2; // Espace entre racines
    }
  });
  
  // Positionner
  let startX = Math.max(50, (canvasWidth - totalWidth) / 2);
  const startY = 50;
  
  families.forEach(family => {
    positionFamily(family, startX, startY);
    startX += family.width + TREE_CONFIG.familySpacing * 2;
  });
}

/**
 * Dessiner les lignes d'une famille (conjoints et enfants)
 */
function drawFamilyLinks(ctx, family) {
  // 1. Ligne entre conjoints (horizontale)
  if (family.parents.length === 2) {
    const parent1 = family.parents[0];
    const parent2 = family.parents[1];
    const y = parent1.y + TREE_CONFIG.nodeHeight / 2;
    const x1 = parent1.x + TREE_CONFIG.nodeWidth;
    const x2 = parent2.x;
    
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.strokeStyle = TREE_CONFIG.colors.conjointLink;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  
  // 2. Lignes vers les enfants
  if (family.children.length > 0) {
    // Point de départ : centre des parents
    let parentCenterX;
    if (family.parents.length === 2) {
      parentCenterX = (family.parents[0].x + family.parents[1].x + TREE_CONFIG.nodeWidth) / 2;
    } else {
      parentCenterX = family.parents[0].x + TREE_CONFIG.nodeWidth / 2;
    }
    const parentBottomY = family.parents[0].y + TREE_CONFIG.nodeHeight;
    
    // Points des enfants
    const childrenY = family.children[0].parents[0].y;
    const midY = parentBottomY + (childrenY - parentBottomY) / 2;
    
    // Ligne verticale du parent vers le milieu
    ctx.beginPath();
    ctx.moveTo(parentCenterX, parentBottomY);
    ctx.lineTo(parentCenterX, midY);
    ctx.strokeStyle = TREE_CONFIG.colors.linkColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Si plusieurs enfants, ligne horizontale
    if (family.children.length > 1) {
      const firstChildX = family.children[0].parents[0].x + TREE_CONFIG.nodeWidth / 2;
      const lastChild = family.children[family.children.length - 1];
      const lastChildX = (lastChild.parents.length === 2) ?
        (lastChild.parents[0].x + lastChild.parents[1].x + TREE_CONFIG.nodeWidth) / 2 :
        lastChild.parents[0].x + TREE_CONFIG.nodeWidth / 2;
      
      ctx.beginPath();
      ctx.moveTo(firstChildX, midY);
      ctx.lineTo(lastChildX, midY);
      ctx.strokeStyle = TREE_CONFIG.colors.linkColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    
    // Lignes verticales vers chaque enfant
    family.children.forEach(childFamily => {
      let childCenterX;
      if (childFamily.parents.length === 2) {
        childCenterX = (childFamily.parents[0].x + childFamily.parents[1].x + TREE_CONFIG.nodeWidth) / 2;
      } else {
        childCenterX = childFamily.parents[0].x + TREE_CONFIG.nodeWidth / 2;
      }
      const childTopY = childFamily.parents[0].y;
      
      ctx.beginPath();
      ctx.moveTo(childCenterX, midY);
      ctx.lineTo(childCenterX, childTopY);
      ctx.strokeStyle = TREE_CONFIG.colors.linkColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      
      // Flèche
      const arrowSize = 6;
      ctx.beginPath();
      ctx.moveTo(childCenterX, childTopY);
      ctx.lineTo(childCenterX - arrowSize, childTopY - arrowSize * 1.5);
      ctx.lineTo(childCenterX + arrowSize, childTopY - arrowSize * 1.5);
      ctx.closePath();
      ctx.fillStyle = TREE_CONFIG.colors.linkColor;
      ctx.fill();
      
      // Récursif pour les enfants
      drawFamilyLinks(ctx, childFamily);
    });
  }
}

/**
 * Collecter tous les nœuds (personnes) d'un arbre de familles
 */
function collectAllNodes(families) {
  const nodes = [];
  
  function collectFromFamily(family) {
    nodes.push(...family.parents);
    family.children.forEach(child => collectFromFamily(child));
  }
  
  families.forEach(family => collectFromFamily(family));
  return nodes;
}

/**
 * Calculer la hauteur maximale de l'arbre (avant positionnement)
 */
function calculateTreeHeight(families) {
  let maxLevel = 0;
  
  function findMaxLevel(family) {
    maxLevel = Math.max(maxLevel, family.level);
    family.children.forEach(child => findMaxLevel(child));
  }
  
  families.forEach(family => findMaxLevel(family));
  
  const height = TREE_CONFIG.parentPlaceholderHeight + 50 + (maxLevel + 1) * (TREE_CONFIG.nodeHeight + TREE_CONFIG.generationSpacing);
  console.log('Hauteur calculée:', height, 'Niveau max:', maxLevel);
  return height;
}

/**
 * Dessiner les placeholders pour parents manquants (rectangles en pointillés)
 */
function drawParentPlaceholders(ctx, family) {
  family.parents.forEach(person => {
    const childX = person.x;
    const childY = person.y;
    
    // Position des placeholders au-dessus
    const placeholderY = 20;
    const spacing = 10;
    
    // Placeholder père (à gauche)
    const fatherX = childX - TREE_CONFIG.nodeWidth - spacing;
    drawPlaceholder(ctx, fatherX, placeholderY, 'Père');
    
    // Ligne du père vers l'enfant
    ctx.beginPath();
    ctx.strokeStyle = TREE_CONFIG.colors.linkColor;
    ctx.lineWidth = 1.5;
    ctx.moveTo(fatherX + TREE_CONFIG.nodeWidth / 2, placeholderY + TREE_CONFIG.parentPlaceholderHeight);
    ctx.lineTo(childX + TREE_CONFIG.nodeWidth / 2, childY);
    ctx.stroke();
    
    // Placeholder mère (à droite)
    const motherX = childX + TREE_CONFIG.nodeWidth + spacing;
    drawPlaceholder(ctx, motherX, placeholderY, 'Mère');
    
    // Ligne de la mère vers l'enfant
    ctx.beginPath();
    ctx.strokeStyle = TREE_CONFIG.colors.linkColor;
    ctx.lineWidth = 1.5;
    ctx.moveTo(motherX + TREE_CONFIG.nodeWidth / 2, placeholderY + TREE_CONFIG.parentPlaceholderHeight);
    ctx.lineTo(childX + TREE_CONFIG.nodeWidth / 2, childY);
    ctx.stroke();
  });
}

/**
 * Dessiner un placeholder (rectangle en pointillés avec croix) - Style moderne
 */
function drawPlaceholder(ctx, x, y, label) {
  const w = TREE_CONFIG.nodeWidth;
  const h = TREE_CONFIG.parentPlaceholderHeight;
  const radius = 10;
  
  // Rectangle en pointillés avec coins arrondis
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
  
  // Fond très clair
  ctx.fillStyle = TREE_CONFIG.colors.placeholder;
  ctx.fill();
  
  // Bordure en pointillés
  ctx.strokeStyle = TREE_CONFIG.colors.placeholderBorder;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Croix "+" au centre (plus grande et stylisée)
  const centerX = x + w / 2;
  const centerY = y + h / 2 - 5;
  const crossSize = 20;
  
  ctx.beginPath();
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  // Ligne verticale
  ctx.moveTo(centerX, centerY - crossSize);
  ctx.lineTo(centerX, centerY + crossSize);
  ctx.stroke();
  // Ligne horizontale
  ctx.beginPath();
  ctx.moveTo(centerX - crossSize, centerY);
  ctx.lineTo(centerX + crossSize, centerY);
  ctx.stroke();
  
  // Label (Père / Mère) en bas
  ctx.fillStyle = '#999999';
  ctx.font = `11px ${TREE_CONFIG.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(label, centerX, y + h - 8);
}

/**
 * Dessiner un nœud (carte de personne) - Style moderne
 */
function drawNode(ctx, person) {
  const x = person.x;
  const y = person.y;
  
  if (!x && x !== 0 || !y && y !== 0) {
    console.warn('Position invalide pour', person.prenom, person.nom, ':', x, y);
    return;
  }
  
  const w = TREE_CONFIG.nodeWidth;
  const h = TREE_CONFIG.nodeHeight;
  const radius = 10;
  
  // Fond blanc
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
  ctx.fill();
  
  // Bordure colorée épaisse selon le sexe
  if (person.sexe === 'M') {
    ctx.strokeStyle = TREE_CONFIG.colors.maleBorder;
  } else if (person.sexe === 'F') {
    ctx.strokeStyle = TREE_CONFIG.colors.femaleBorder;
  } else {
    ctx.strokeStyle = '#999999';
  }
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Avatar rond (à gauche)
  const avatarSize = 45;
  const avatarX = x + 15;
  const avatarY = y + 15;
  const avatarRadius = avatarSize / 2;
  
  // Cercle avatar
  ctx.beginPath();
  ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2);
  ctx.closePath();
  
  // Fond de l'avatar selon le sexe
  if (person.sexe === 'M') {
    ctx.fillStyle = TREE_CONFIG.colors.male;
  } else if (person.sexe === 'F') {
    ctx.fillStyle = TREE_CONFIG.colors.female;
  } else {
    ctx.fillStyle = '#f0f0f0';
  }
  ctx.fill();
  
  // Bordure avatar
  ctx.strokeStyle = person.sexe === 'M' ? TREE_CONFIG.colors.maleBorder : TREE_CONFIG.colors.femaleBorder;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Icône personne dans l'avatar
  ctx.fillStyle = '#999999';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👤', avatarX + avatarRadius, avatarY + avatarRadius);
  
  // Icône de statut (vivant/décédé) en haut à droite
  const statusX = x + w - 25;
  const statusY = y + 20;
  const statusRadius = 10;
  
  ctx.beginPath();
  ctx.arc(statusX, statusY, statusRadius, 0, Math.PI * 2);
  ctx.fillStyle = person.vivant ? TREE_CONFIG.colors.statusAlive : TREE_CONFIG.colors.statusDeceased;
  ctx.fill();
  
  // Icône dans le cercle de statut
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(person.vivant ? '✓' : '†', statusX, statusY);
  
  // Prénom (première ligne - à droite de l'avatar)
  ctx.fillStyle = TREE_CONFIG.colors.nodeText;
  ctx.font = `bold 14px ${TREE_CONFIG.fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const nameX = avatarX + avatarSize + 10;
  const nameY = y + 12;
  const maxNameWidth = w - (nameX - x) - 45; // Espace pour le statut
  
  const prenom = person.prenom || '';
  const nom = person.nom || '';
  
  // Tronquer le prénom si trop long
  let displayPrenom = prenom;
  ctx.font = `bold 14px ${TREE_CONFIG.fontFamily}`;
  if (ctx.measureText(displayPrenom).width > maxNameWidth) {
    while (ctx.measureText(displayPrenom + '...').width > maxNameWidth && displayPrenom.length > 0) {
      displayPrenom = displayPrenom.slice(0, -1);
    }
    displayPrenom += '...';
  }
  
  ctx.fillText(displayPrenom, nameX, nameY);
  
  // Nom de famille (deuxième ligne)
  ctx.font = `bold 13px ${TREE_CONFIG.fontFamily}`;
  ctx.fillStyle = '#555555';
  
  let displayNom = nom;
  if (ctx.measureText(displayNom).width > maxNameWidth) {
    while (ctx.measureText(displayNom + '...').width > maxNameWidth && displayNom.length > 0) {
      displayNom = displayNom.slice(0, -1);
    }
    displayNom += '...';
  }
  
  ctx.fillText(displayNom.toUpperCase(), nameX, nameY + 18);
  
  // Dates (en dessous du nom)
  ctx.font = `11px ${TREE_CONFIG.fontFamily}`;
  ctx.fillStyle = '#999999';
  
  const dateNaissance = person.date_naissance ? 
    new Date(person.date_naissance).toLocaleDateString('fr-FR', {year: 'numeric'}) : '?';
  const dateDeces = person.date_deces ? 
    new Date(person.date_deces).toLocaleDateString('fr-FR', {year: 'numeric'}) : 
    (person.vivant ? '...' : '?');
  
  ctx.fillText(`${dateNaissance} – ${dateDeces}`, nameX, nameY + 38);
  
  // Icône caméra sous l'avatar (si pas de photo)
  if (!person.photo_principale) {
    ctx.fillStyle = '#cccccc';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📷', avatarX + avatarRadius, avatarY + avatarSize + 8);
  }
}

/**
 * Fonction principale de dessin de l'arbre
 */
/**
 * Fonction principale de dessin de l'arbre par familles
 */
function drawTreeCanvas(ctx, canvas, people, relations) {
  console.log('=== drawTreeCanvas appelé ===');
  console.log('Personnes:', people.length, 'Relations:', relations.length);
  console.log('Canvas:', canvas.width, 'x', canvas.height);
  console.log('Context:', ctx);
  
  // Construire l'arbre par familles
  const families = buildFamilyTree(people, relations);
  console.log('Familles racines:', families.length);
  
  if (families.length === 0) {
    console.error('Aucune famille construite !');
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText('Aucune famille à afficher', 50, 50);
    return;
  }
  
  // Calculer dimensions
  const canvasWidth = Math.max(1400, window.innerWidth - 100);
  
  // Calculer les largeurs des familles
  families.forEach(family => calculateFamilyWidths(family));
  
  const canvasHeight = calculateTreeHeight(families) + 100;
  console.log('Dimensions calculées - Width:', canvasWidth, 'Height:', canvasHeight);
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  // Fond blanc élégant
  ctx.fillStyle = '#fafbfc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Calculer les positions
  calculateNodePositions(families, canvasWidth);
  
  // Collecter tous les nœuds
  const allNodes = collectAllNodes(families);
  console.log('Nœuds positionnés:', allNodes.length);
  
  if (allNodes.length > 0) {
    console.log('Premier nœud:', allNodes[0].prenom, allNodes[0].nom, 'Position:', allNodes[0].x, allNodes[0].y);
  }
  
  // Étape 1 : Dessiner les lignes (récursif)
  console.log('Dessin des lignes...');
  families.forEach(family => {
    drawFamilyLinks(ctx, family);
  });
  
  // Étape 2 : Dessiner les placeholders pour parents manquants
  console.log('Dessin des placeholders...');
  families.forEach(family => {
    if (family.hasParentPlaceholders) {
      drawParentPlaceholders(ctx, family);
    }
  });
  
  // Étape 3 : Dessiner les nœuds (par-dessus)
  console.log('Dessin des nœuds...');
  allNodes.forEach(person => {
    drawNode(ctx, person);
  });
  
  console.log('=== Dessin terminé ===');
  
  // Gestion du clic
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    for (const person of allNodes) {
      if (x >= person.x && x <= person.x + TREE_CONFIG.nodeWidth &&
          y >= person.y && y <= person.y + TREE_CONFIG.nodeHeight) {
        showPersonDetail(person.id);
        return;
      }
    }
  };
}

/**
 * ====================================================================
 * NOUVEL ALGORITHME : Arbre complet à partir d'une personne centrale
 * ====================================================================
 */

/**
 * Construire un arbre hiérarchique (sablier) à partir d'une personne
 */
function buildCompleteTreeFromPerson(people, relations, centralPersonId) {
  console.log('=== buildCompleteTreeFromPerson ===');
  console.log('Personne centrale ID:', centralPersonId);
  
  const centralPerson = people.find(p => p.id === centralPersonId);
  if (!centralPerson) {
    console.error('Personne centrale non trouvée');
    return null;
  }
  
  console.log('Personne centrale:', centralPerson.prenom, centralPerson.nom);
  
  // Maps pour accès rapide
  const parentsMap = new Map();  // child_id -> [parent_ids]
  const childrenMap = new Map(); // parent_id -> [child_ids]
  const spousesMap = new Map();  // person_id -> [spouse_ids] (PLURIEL pour mariages multiples)
  
  relations.forEach(rel => {
    if (rel.type_relation === 'parent') {
      if (!childrenMap.has(rel.person1_id)) childrenMap.set(rel.person1_id, []);
      childrenMap.get(rel.person1_id).push(rel.person2_id);
      
      if (!parentsMap.has(rel.person2_id)) parentsMap.set(rel.person2_id, []);
      parentsMap.get(rel.person2_id).push(rel.person1_id);
    } else if (rel.type_relation === 'enfant') {
      if (!childrenMap.has(rel.person2_id)) childrenMap.set(rel.person2_id, []);
      childrenMap.get(rel.person2_id).push(rel.person1_id);
      
      if (!parentsMap.has(rel.person1_id)) parentsMap.set(rel.person1_id, []);
      parentsMap.get(rel.person1_id).push(rel.person2_id);
    } else if (rel.type_relation === 'conjoint') {
      // Stocker TOUS les conjoints (pas juste un)
      if (!spousesMap.has(rel.person1_id)) spousesMap.set(rel.person1_id, []);
      if (!spousesMap.get(rel.person1_id).includes(rel.person2_id)) {
        spousesMap.get(rel.person1_id).push(rel.person2_id);
      }
      
      if (!spousesMap.has(rel.person2_id)) spousesMap.set(rel.person2_id, []);
      if (!spousesMap.get(rel.person2_id).includes(rel.person1_id)) {
        spousesMap.get(rel.person2_id).push(rel.person1_id);
      }
    }
  });
  
  /**
   * Construire récursivement les ancêtres d'une personne
   */
  const visited = new Set();
  
  function buildAncestors(personId, level = 0) {
    const person = people.find(p => p.id === personId);
    if (!person || visited.has(personId)) return null;
    
    visited.add(personId);
    
    const node = {
      person: person,
      spouse: null,
      level: level,
      parents: [], // Deux branches : parents de la personne et parents du conjoint
      children: [] // Sera rempli par buildDescendants
    };
    
    // Trouver le conjoint (pour les ancêtres, on prend le premier si plusieurs)
    const spouseIds = spousesMap.get(personId) || [];
    if (spouseIds.length > 0 && !visited.has(spouseIds[0])) {
      const spouse = people.find(p => p.id === spouseIds[0]);
      if (spouse) {
        node.spouse = spouse;
        // NE PAS ajouter au visited Set ici, car le conjoint peut aussi être un parent direct
      }
    }
    
    // Construire les ancêtres de la personne
    const parentIds = parentsMap.get(personId) || [];
    if (parentIds.length > 0) {
      const parentsBranch = {
        type: 'parents_of_person',
        people: []
      };
      
      // Si deux parents et ils sont conjoints, créer un seul nœud pour le couple
      if (parentIds.length === 2) {
        const parent1Spouses = spousesMap.get(parentIds[0]) || [];
        const areSpouses = parent1Spouses.includes(parentIds[1]);
        
        if (areSpouses) {
          // Les parents sont mariés : créer un seul nœud avec les deux
          const parent1Node = buildAncestors(parentIds[0], level - 1);
          if (parent1Node) {
            parentsBranch.people.push(parent1Node);
            // Marquer le deuxième parent comme visité pour éviter de le recréer
            visited.add(parentIds[1]);
          }
        } else {
          // Parents non mariés
          parentIds.forEach(parentId => {
            const parentNode = buildAncestors(parentId, level - 1);
            if (parentNode) {
              parentsBranch.people.push(parentNode);
            }
          });
        }
      } else {
        // Un seul parent ou plus de deux (cas rare)
        parentIds.forEach(parentId => {
          const parentNode = buildAncestors(parentId, level - 1);
          if (parentNode) {
            parentsBranch.people.push(parentNode);
          }
        });
      }
      
      if (parentsBranch.people.length > 0) {
        node.parents.push(parentsBranch);
      }
    }
    
    // Construire les ancêtres du conjoint
    if (node.spouse) {
      const spouseParentIds = parentsMap.get(node.spouse.id) || [];
      if (spouseParentIds.length > 0) {
        const spouseParentsBranch = {
          type: 'parents_of_spouse',
          people: []
        };
        
        // Si deux parents et ils sont conjoints, créer un seul nœud pour le couple
        if (spouseParentIds.length === 2) {
          const parent1Spouses = spousesMap.get(spouseParentIds[0]) || [];
          const areSpouses = parent1Spouses.includes(spouseParentIds[1]);
          
          if (areSpouses) {
            // Les parents sont mariés : créer un seul nœud avec les deux
            const parent1Node = buildAncestors(spouseParentIds[0], level - 1);
            if (parent1Node) {
              spouseParentsBranch.people.push(parent1Node);
              // Marquer le deuxième parent comme visité pour éviter de le recréer
              visited.add(spouseParentIds[1]);
            }
          } else {
            // Parents non mariés
            spouseParentIds.forEach(parentId => {
              const parentNode = buildAncestors(parentId, level - 1);
              if (parentNode) {
                spouseParentsBranch.people.push(parentNode);
              }
            });
          }
        } else {
          // Un seul parent ou plus de deux
          spouseParentIds.forEach(parentId => {
            const parentNode = buildAncestors(parentId, level - 1);
            if (parentNode) {
              spouseParentsBranch.people.push(parentNode);
            }
          });
        }
        
        if (spouseParentsBranch.people.length > 0) {
          node.parents.push(spouseParentsBranch);
        }
      }
    }
    
    return node;
  }
  
  /**
   * Construire récursivement les descendants d'un couple
   */
  function buildDescendants(personId, spouseId, level = 0, descendantVisited = new Set()) {
    const childIds = new Set([
      ...(childrenMap.get(personId) || []),
      ...(spouseId ? (childrenMap.get(spouseId) || []) : [])
    ]);
    
    const children = [];
    
    childIds.forEach(childId => {
      if (descendantVisited.has(childId)) return;
      
      const child = people.find(p => p.id === childId);
      if (!child) return;
      
      descendantVisited.add(childId);
      
      const childNode = {
        person: child,
        spouse: null,
        level: level,
        children: []
      };
      
      // Trouver le conjoint de l'enfant (prendre le premier si plusieurs)
      const childSpouseIds = spousesMap.get(childId) || [];
      const childSpouseId = childSpouseIds.length > 0 ? childSpouseIds[0] : null;
      
      if (childSpouseId && !descendantVisited.has(childSpouseId)) {
        const childSpouse = people.find(p => p.id === childSpouseId);
        if (childSpouse) {
          childNode.spouse = childSpouse;
          descendantVisited.add(childSpouseId);
        }
      }
      
      // Construire les descendants de l'enfant
      const grandChildren = buildDescendants(childId, childSpouseId, level + 1, descendantVisited);
      childNode.children = grandChildren;
      
      children.push(childNode);
    });
    
    return children;
  }
  
  // Construire l'arbre complet
  const rootNode = buildAncestors(centralPersonId, 0);
  if (!rootNode) return null;
  
  // Gérer les descendants avec mariages multiples
  const spouseIds = spousesMap.get(centralPersonId) || [];
  console.log('Conjoints de la personne centrale:', spouseIds.length);
  
  if (spouseIds.length === 0) {
    // Pas de conjoint, juste les enfants directs
    const descendantVisited = new Set();
    rootNode.children = buildDescendants(centralPersonId, null, 1, descendantVisited);
  } else if (spouseIds.length === 1) {
    // Un seul conjoint, comportement normal
    const descendantVisited = new Set();
    rootNode.children = buildDescendants(centralPersonId, spouseIds[0], 1, descendantVisited);
  } else {
    // MARIAGES MULTIPLES : créer des groupes séparés pour chaque mariage
    rootNode.marriages = [];
    const allChildIds = childrenMap.get(centralPersonId) || [];
    
    spouseIds.forEach(spouseId => {
      const spouse = people.find(p => p.id === spouseId);
      if (!spouse) return;
      
      // Trouver les enfants communs entre la personne centrale et ce conjoint
      const spouseChildIds = childrenMap.get(spouseId) || [];
      const commonChildIds = allChildIds.filter(childId => spouseChildIds.includes(childId));
      
      console.log(`Mariage avec ${spouse.prenom} ${spouse.nom}: ${commonChildIds.length} enfants communs`);
      
      // Créer un groupe de mariage
      const marriageGroup = {
        spouse: spouse,
        children: []
      };
      
      // Construire les nœuds enfants pour ce mariage
      const descendantVisited = new Set();
      commonChildIds.forEach(childId => {
        if (descendantVisited.has(childId)) return;
        
        const child = people.find(p => p.id === childId);
        if (!child) return;
        
        descendantVisited.add(childId);
        
        const childNode = {
          person: child,
          spouse: null,
          level: 1,
          children: []
        };
        
        // Trouver le conjoint de l'enfant
        const childSpouseIds = spousesMap.get(childId) || [];
        if (childSpouseIds.length > 0 && !descendantVisited.has(childSpouseIds[0])) {
          const childSpouse = people.find(p => p.id === childSpouseIds[0]);
          if (childSpouse) {
            childNode.spouse = childSpouse;
            descendantVisited.add(childSpouseIds[0]);
          }
        }
        
        // Construire les petits-enfants
        const grandChildren = buildDescendants(childId, childNode.spouse ? childNode.spouse.id : null, 2, descendantVisited);
        childNode.children = grandChildren;
        
        marriageGroup.children.push(childNode);
      });
      
      rootNode.marriages.push(marriageGroup);
    });
    
    // Pour compatibilité avec le reste du code, créer aussi un tableau children global
    rootNode.children = [];
    rootNode.marriages.forEach(marriage => {
      rootNode.children.push(...marriage.children);
    });
  }
  
  console.log('Arbre construit:', rootNode);
  
  return {
    root: rootNode,
    parentsMap,
    childrenMap,
    spousesMap
  };
}

/**
 * Calculer les largeurs récursivement (bottom-up)
 */
function calculateNodeWidths(node) {
  if (!node) return 0;
  
  // Largeur de la personne seule (sans conjoint au niveau racine pour mariages multiples)
  let coupleWidth;
  
  // MARIAGES MULTIPLES : gérer plusieurs groupes de mariages
  if (node.marriages && node.marriages.length > 0) {
    // Personne centrale seule (les conjoints sont dans les groupes de mariages)
    coupleWidth = TREE_CONFIG.nodeWidth;
    
    // Calculer la largeur de chaque groupe de mariage
    let marriagesTotalWidth = 0;
    node.marriages.forEach((marriage, index) => {
      // Largeur du couple (personne + conjoint)
      const marriageCoupleWidth = TREE_CONFIG.nodeWidth * 2 + TREE_CONFIG.horizontalSpacing;
      
      // Largeur des enfants de ce mariage
      let childrenWidth = 0;
      if (marriage.children && marriage.children.length > 0) {
        marriage.children.forEach((child, childIndex) => {
          const childWidth = calculateNodeWidths(child);
          childrenWidth += childWidth;
          if (childIndex < marriage.children.length - 1) {
            childrenWidth += TREE_CONFIG.familySpacing;
          }
        });
      }
      
      // Largeur du groupe = max(couple, enfants)
      marriage.width = Math.max(marriageCoupleWidth, childrenWidth);
      marriagesTotalWidth += marriage.width;
      
      if (index < node.marriages.length - 1) {
        marriagesTotalWidth += TREE_CONFIG.familySpacing * 3; // Espacement entre mariages
      }
    });
    
    node.width = Math.max(coupleWidth, marriagesTotalWidth);
  } else {
    // CAS NORMAL : un seul mariage ou pas de conjoint
    coupleWidth = node.spouse ? 
      (TREE_CONFIG.nodeWidth * 2 + TREE_CONFIG.horizontalSpacing) : 
      TREE_CONFIG.nodeWidth;
    
    // Si pas d'enfants, la largeur est celle du couple
    if (!node.children || node.children.length === 0) {
      node.width = coupleWidth;
      return coupleWidth;
    }
    
    // Calculer la largeur des enfants
    let childrenTotalWidth = 0;
    node.children.forEach((child, index) => {
      const childWidth = calculateNodeWidths(child);
      childrenTotalWidth += childWidth;
      if (index < node.children.length - 1) {
        childrenTotalWidth += TREE_CONFIG.familySpacing;
      }
    });
    
    // La largeur est le max entre le couple et les enfants
    node.width = Math.max(coupleWidth, childrenTotalWidth);
  }
  
  // Calculer la largeur des branches de parents
  if (node.parents && node.parents.length > 0) {
    node.parents.forEach(branch => {
      let branchWidth = 0;
      branch.people.forEach((parent, index) => {
        const parentWidth = calculateNodeWidths(parent);
        branchWidth += parentWidth;
        if (index < branch.people.length - 1) {
          branchWidth += TREE_CONFIG.familySpacing * 2;
        }
      });
      branch.width = branchWidth;
    });
  }
  
  return node.width;
}

/**
 * Positionner récursivement les nœuds (top-down)
 */
function positionNodes(node, centerX, y) {
  if (!node) return;
  
  // Positionner le couple au centre
  if (node.spouse) {
    node.person.x = centerX - TREE_CONFIG.nodeWidth - TREE_CONFIG.horizontalSpacing / 2;
    node.person.y = y;
    node.spouse.x = centerX + TREE_CONFIG.horizontalSpacing / 2;
    node.spouse.y = y;
  } else {
    node.person.x = centerX - TREE_CONFIG.nodeWidth / 2;
    node.person.y = y;
  }
  
  // Positionner les parents au-dessus
  if (node.parents && node.parents.length > 0) {
    const parentsY = y - TREE_CONFIG.nodeHeight - TREE_CONFIG.generationSpacing;
    
    if (node.parents.length === 1) {
      // Une seule branche de parents
      const branch = node.parents[0];
      const branchCenterX = branch.type === 'parents_of_person' ? 
        node.person.x + TREE_CONFIG.nodeWidth / 2 : 
        (node.spouse ? node.spouse.x + TREE_CONFIG.nodeWidth / 2 : centerX);
      
      if (branch.people.length === 1) {
        // Un seul nœud parent (qui peut être un couple avec spouse)
        positionNodes(branch.people[0], branchCenterX, parentsY);
      } else if (branch.people.length === 2) {
        // Deux nœuds parents séparés (non mariés)
        const parent1 = branch.people[0];
        const parent2 = branch.people[1];
        
        positionNodes(parent1, branchCenterX - TREE_CONFIG.nodeWidth / 2 - TREE_CONFIG.horizontalSpacing / 2, parentsY);
        positionNodes(parent2, branchCenterX + TREE_CONFIG.nodeWidth / 2 + TREE_CONFIG.horizontalSpacing / 2, parentsY);
      }
    } else if (node.parents.length === 2) {
      // Deux branches : parents de la personne + parents du conjoint
      // IMPORTANT : identifier les branches par leur type, pas par leur position !
      const branch1 = node.parents.find(b => b.type === 'parents_of_person');
      const branch2 = node.parents.find(b => b.type === 'parents_of_spouse');
      
      if (!branch1 || !branch2) {
        console.warn('Branches de parents mal identifiées', node);
        return;
      }
      
      const person1CenterX = node.person.x + TREE_CONFIG.nodeWidth / 2;
      const person2CenterX = node.spouse ? node.spouse.x + TREE_CONFIG.nodeWidth / 2 : person1CenterX;
      
      // Positionner les parents de la personne (au-dessus de la personne)
      if (branch1.people.length === 1) {
        // Un seul nœud (peut être un couple avec spouse)
        positionNodes(branch1.people[0], person1CenterX, parentsY);
      } else if (branch1.people.length === 2) {
        // Deux nœuds séparés
        positionNodes(branch1.people[0], person1CenterX - TREE_CONFIG.nodeWidth / 2 - TREE_CONFIG.horizontalSpacing / 2, parentsY);
        positionNodes(branch1.people[1], person1CenterX + TREE_CONFIG.nodeWidth / 2 + TREE_CONFIG.horizontalSpacing / 2, parentsY);
      }
      
      // Positionner les parents du conjoint (au-dessus du conjoint)
      if (branch2.people.length === 1) {
        // Un seul nœud (peut être un couple avec spouse)
        positionNodes(branch2.people[0], person2CenterX, parentsY);
      } else if (branch2.people.length === 2) {
        // Deux nœuds séparés
        positionNodes(branch2.people[0], person2CenterX - TREE_CONFIG.nodeWidth / 2 - TREE_CONFIG.horizontalSpacing / 2, parentsY);
        positionNodes(branch2.people[1], person2CenterX + TREE_CONFIG.nodeWidth / 2 + TREE_CONFIG.horizontalSpacing / 2, parentsY);
      }
    }
  }
  
  // Positionner les enfants en dessous
  if (node.marriages && node.marriages.length > 0) {
    // MARIAGES MULTIPLES : positionner chaque groupe séparément
    // Première rangée : les conjoints
    const spousesY = y + TREE_CONFIG.nodeHeight + TREE_CONFIG.generationSpacing;
    
    // Calculer la largeur totale de tous les groupes de conjoints+enfants
    let marriagesTotalWidth = 0;
    node.marriages.forEach((marriage, index) => {
      marriagesTotalWidth += marriage.width;
      if (index < node.marriages.length - 1) {
        marriagesTotalWidth += TREE_CONFIG.familySpacing * 3;
      }
    });
    
    // Point de départ pour les mariages (centré sous la personne)
    let marriageX = centerX - marriagesTotalWidth / 2;
    
    node.marriages.forEach(marriage => {
      const marriageCenterX = marriageX + marriage.width / 2;
      
      // Positionner SEULEMENT le conjoint (pas de copie de la personne centrale)
      marriage.spouse.x = marriageCenterX - TREE_CONFIG.nodeWidth / 2;
      marriage.spouse.y = spousesY;
      
      // Positionner les enfants de ce mariage
      if (marriage.children && marriage.children.length > 0) {
        const childrenY = spousesY + TREE_CONFIG.nodeHeight + TREE_CONFIG.generationSpacing;
        
        // Calculer la largeur totale des enfants de ce mariage
        let childrenTotalWidth = 0;
        marriage.children.forEach((child, index) => {
          childrenTotalWidth += child.width;
          if (index < marriage.children.length - 1) {
            childrenTotalWidth += TREE_CONFIG.familySpacing;
          }
        });
        
        // Point de départ pour les enfants (centré sous le conjoint)
        let childX = marriageCenterX - childrenTotalWidth / 2;
        
        marriage.children.forEach(child => {
          const childCenterX = childX + child.width / 2;
          positionNodes(child, childCenterX, childrenY);
          childX += child.width + TREE_CONFIG.familySpacing;
        });
      }
      
      marriageX += marriage.width + TREE_CONFIG.familySpacing * 3;
    });
  } else if (node.children && node.children.length > 0) {
    // CAS NORMAL : un seul mariage ou pas de conjoint
    const childrenY = y + TREE_CONFIG.nodeHeight + TREE_CONFIG.generationSpacing;
    
    // Calculer la largeur totale des enfants
    let childrenTotalWidth = 0;
    node.children.forEach((child, index) => {
      childrenTotalWidth += child.width;
      if (index < node.children.length - 1) {
        childrenTotalWidth += TREE_CONFIG.familySpacing;
      }
    });
    
    // Point de départ pour les enfants (centré sous le couple)
    let childX = centerX - childrenTotalWidth / 2;
    
    node.children.forEach(child => {
      const childCenterX = childX + child.width / 2;
      positionNodes(child, childCenterX, childrenY);
      childX += child.width + TREE_CONFIG.familySpacing;
    });
  }
}

/**
 * Calculer la hauteur totale de l'arbre (min et max Y)
 */
function calculateTreeBounds(node, bounds = { minY: Infinity, maxY: -Infinity }) {
  if (!node) return bounds;
  
  if (node.person.y !== undefined) {
    bounds.minY = Math.min(bounds.minY, node.person.y);
    bounds.maxY = Math.max(bounds.maxY, node.person.y + TREE_CONFIG.nodeHeight);
  }
  
  if (node.spouse && node.spouse.y !== undefined) {
    bounds.minY = Math.min(bounds.minY, node.spouse.y);
    bounds.maxY = Math.max(bounds.maxY, node.spouse.y + TREE_CONFIG.nodeHeight);
  }
  
  // Parents
  if (node.parents) {
    node.parents.forEach(branch => {
      branch.people.forEach(parent => {
        calculateTreeBounds(parent, bounds);
      });
    });
  }
  
  // Enfants
  if (node.children) {
    node.children.forEach(child => {
      calculateTreeBounds(child, bounds);
    });
  }
  
  // Mariages (pour mariages multiples)
  if (node.marriages) {
    node.marriages.forEach(marriage => {
      // Bounds du conjoint
      if (marriage.spouse && marriage.spouse.y !== undefined) {
        bounds.minY = Math.min(bounds.minY, marriage.spouse.y);
        bounds.maxY = Math.max(bounds.maxY, marriage.spouse.y + TREE_CONFIG.nodeHeight);
      }
      // Bounds des enfants
      if (marriage.children) {
        marriage.children.forEach(child => {
          calculateTreeBounds(child, bounds);
        });
      }
    });
  }
  
  return bounds;
}

/**
 * Collecter tous les nœuds pour le dessin
 */
function collectAllNodesFromTree(node, collected = []) {
  if (!node) return collected;
  
  collected.push(node.person);
  if (node.spouse) collected.push(node.spouse);
  
  // Parents
  if (node.parents) {
    node.parents.forEach(branch => {
      branch.people.forEach(parent => {
        collectAllNodesFromTree(parent, collected);
      });
    });
  }
  
  // Enfants
  if (node.children) {
    node.children.forEach(child => {
      collectAllNodesFromTree(child, collected);
    });
  }
  
  // Mariages (pour mariages multiples)
  if (node.marriages) {
    node.marriages.forEach(marriage => {
      // Collecter le conjoint
      if (marriage.spouse) {
        collected.push(marriage.spouse);
      }
      // Collecter les enfants
      if (marriage.children) {
        marriage.children.forEach(child => {
          collectAllNodesFromTree(child, collected);
        });
      }
    });
  }
  
  return collected;
}

/**
 * Dessiner les liens récursivement avec courbes de Bézier
 */
function drawTreeLinks(ctx, node) {
  if (!node) return;
  
  ctx.strokeStyle = TREE_CONFIG.colors.linkColor;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Ligne horizontale entre conjoints (légèrement courbe)
  if (node.spouse) {
    const y = node.person.y + TREE_CONFIG.nodeHeight / 2;
    const x1 = node.person.x + TREE_CONFIG.nodeWidth;
    const x2 = node.spouse.x;
    const midX = (x1 + x2) / 2;
    
    ctx.beginPath();
    ctx.moveTo(x1, y);
    // Courbe légère vers le bas pour donner un effet élégant
    ctx.quadraticCurveTo(midX, y + 5, x2, y);
    ctx.stroke();
  }
  
  // Liens vers les parents avec courbes et points de connexion
  if (node.parents && node.parents.length > 0) {
    node.parents.forEach(branch => {
      const targetPerson = branch.type === 'parents_of_person' ? node.person : node.spouse;
      if (!targetPerson) return;
      
      const childTopY = targetPerson.y;
      const childCenterX = targetPerson.x + TREE_CONFIG.nodeWidth / 2;
      
      branch.people.forEach(parent => {
        // Calculer le centre du couple parent (ou de la personne seule)
        const parentCenterX = parent.spouse ? 
          (parent.person.x + parent.spouse.x + TREE_CONFIG.nodeWidth) / 2 :
          parent.person.x + TREE_CONFIG.nodeWidth / 2;
        const parentBottomY = parent.person.y + TREE_CONFIG.nodeHeight;
        
        const controlOffset = TREE_CONFIG.generationSpacing * 0.4;
        
        // Ligne courbe du centre du couple parent vers l'enfant
        ctx.beginPath();
        ctx.moveTo(parentCenterX, parentBottomY);
        ctx.bezierCurveTo(
          parentCenterX, parentBottomY + controlOffset,
          childCenterX, childTopY - controlOffset,
          childCenterX, childTopY
        );
        ctx.stroke();
        
        // Point de connexion en bas du couple parent
        ctx.beginPath();
        ctx.arc(parentCenterX, parentBottomY, 4, 0, Math.PI * 2);
        ctx.fillStyle = TREE_CONFIG.colors.linkColor;
        ctx.fill();
        
        // Point de connexion en haut de l'enfant
        ctx.beginPath();
        ctx.arc(childCenterX, childTopY, 4, 0, Math.PI * 2);
        ctx.fillStyle = TREE_CONFIG.colors.linkColor;
        ctx.fill();
        
        // Récursif pour les ancêtres
        drawTreeLinks(ctx, parent);
      });
    });
  }
  
  // Liens vers les enfants avec courbes et points de connexion
  if (node.marriages && node.marriages.length > 0) {
    // MARIAGES MULTIPLES : dessiner les liens pour chaque mariage séparément
    
    // Centre de la personne centrale (UN SEUL Jean-Pol)
    const personCenterX = node.person.x + TREE_CONFIG.nodeWidth / 2;
    const personBottomY = node.person.y + TREE_CONFIG.nodeHeight;
    
    node.marriages.forEach(marriage => {
      if (!marriage.spouse) return;
      
      // Position du conjoint
      const spouseCenterX = marriage.spouse.x + TREE_CONFIG.nodeWidth / 2;
      const spouseTopY = marriage.spouse.y;
      const spouseBottomY = marriage.spouse.y + TREE_CONFIG.nodeHeight;
      
      // Ligne de la personne centrale vers le conjoint (courbe en Y)
      const midY = (personBottomY + spouseTopY) / 2;
      
      ctx.beginPath();
      ctx.moveTo(personCenterX, personBottomY);
      ctx.bezierCurveTo(
        personCenterX, midY,
        spouseCenterX, midY,
        spouseCenterX, spouseTopY
      );
      ctx.stroke();
      
      // Points de connexion
      ctx.beginPath();
      ctx.arc(personCenterX, personBottomY, 4, 0, Math.PI * 2);
      ctx.fillStyle = TREE_CONFIG.colors.linkColor;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(spouseCenterX, spouseTopY, 4, 0, Math.PI * 2);
      ctx.fillStyle = TREE_CONFIG.colors.linkColor;
      ctx.fill();
      
      // Si ce mariage a des enfants, tracer les liens vers eux
      if (marriage.children && marriage.children.length > 0) {
        const childrenMidY = spouseBottomY + TREE_CONFIG.generationSpacing / 2;
        
        // Ligne verticale du conjoint vers le point intermédiaire
        ctx.beginPath();
        ctx.moveTo(spouseCenterX, spouseBottomY);
        ctx.lineTo(spouseCenterX, childrenMidY);
        ctx.stroke();
        
        // Point de connexion au conjoint
        ctx.beginPath();
        ctx.arc(spouseCenterX, spouseBottomY, 4, 0, Math.PI * 2);
        ctx.fillStyle = TREE_CONFIG.colors.linkColor;
        ctx.fill();
        
        // Point de jonction intermédiaire
        ctx.beginPath();
        ctx.arc(spouseCenterX, childrenMidY, 5, 0, Math.PI * 2);
        ctx.fillStyle = TREE_CONFIG.colors.linkColor;
        ctx.fill();
        
        // Si plusieurs enfants, ligne horizontale
        if (marriage.children.length > 1) {
          const firstChildCenterX = marriage.children[0].spouse ?
            (marriage.children[0].person.x + marriage.children[0].spouse.x + TREE_CONFIG.nodeWidth) / 2 :
            marriage.children[0].person.x + TREE_CONFIG.nodeWidth / 2;
          
          const lastChild = marriage.children[marriage.children.length - 1];
          const lastChildCenterX = lastChild.spouse ?
            (lastChild.person.x + lastChild.spouse.x + TREE_CONFIG.nodeWidth) / 2 :
            lastChild.person.x + TREE_CONFIG.nodeWidth / 2;
          
          ctx.beginPath();
          ctx.moveTo(firstChildCenterX, childrenMidY);
          ctx.lineTo(lastChildCenterX, childrenMidY);
          ctx.stroke();
          
          // Points aux extrémités
          ctx.beginPath();
          ctx.arc(firstChildCenterX, childrenMidY, 4, 0, Math.PI * 2);
          ctx.fillStyle = TREE_CONFIG.colors.linkColor;
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(lastChildCenterX, childrenMidY, 4, 0, Math.PI * 2);
          ctx.fillStyle = TREE_CONFIG.colors.linkColor;
          ctx.fill();
        }
        
        // Lignes courbes vers chaque enfant
        marriage.children.forEach(child => {
          const childCenterX = child.spouse ?
            (child.person.x + child.spouse.x + TREE_CONFIG.nodeWidth) / 2 :
            child.person.x + TREE_CONFIG.nodeWidth / 2;
          const childTopY = child.person.y;
          
          ctx.beginPath();
          ctx.moveTo(childCenterX, childrenMidY);
          ctx.lineTo(childCenterX, childTopY);
          ctx.stroke();
          
          // Point de connexion en haut de l'enfant
          ctx.beginPath();
          ctx.arc(childCenterX, childTopY, 4, 0, Math.PI * 2);
          ctx.fillStyle = TREE_CONFIG.colors.linkColor;
          ctx.fill();
          
          // Récursif pour les descendants
          drawTreeLinks(ctx, child);
        });
      }
    });
  } else if (node.children && node.children.length > 0) {
    // CAS NORMAL : un seul mariage ou pas de conjoint
    // Centre du couple
    const coupleCenterX = node.spouse ? 
      (node.person.x + node.spouse.x + TREE_CONFIG.nodeWidth) / 2 :
      node.person.x + TREE_CONFIG.nodeWidth / 2;
    const coupleBottomY = node.person.y + TREE_CONFIG.nodeHeight;
    
    // Point intermédiaire
    const midY = coupleBottomY + TREE_CONFIG.generationSpacing / 2;
    
    // Ligne verticale du couple vers le point intermédiaire
    ctx.beginPath();
    ctx.moveTo(coupleCenterX, coupleBottomY);
    ctx.lineTo(coupleCenterX, midY);
    ctx.stroke();
    
    // Point de connexion au couple
    ctx.beginPath();
    ctx.arc(coupleCenterX, coupleBottomY, 4, 0, Math.PI * 2);
    ctx.fillStyle = TREE_CONFIG.colors.linkColor;
    ctx.fill();
    
    // Point de jonction intermédiaire
    ctx.beginPath();
    ctx.arc(coupleCenterX, midY, 5, 0, Math.PI * 2);
    ctx.fillStyle = TREE_CONFIG.colors.linkColor;
    ctx.fill();
    
    // Si plusieurs enfants, ligne horizontale courbe
    if (node.children.length > 1) {
      const firstChildCenterX = node.children[0].spouse ?
        (node.children[0].person.x + node.children[0].spouse.x + TREE_CONFIG.nodeWidth) / 2 :
        node.children[0].person.x + TREE_CONFIG.nodeWidth / 2;
      
      const lastChild = node.children[node.children.length - 1];
      const lastChildCenterX = lastChild.spouse ?
        (lastChild.person.x + lastChild.spouse.x + TREE_CONFIG.nodeWidth) / 2 :
        lastChild.person.x + TREE_CONFIG.nodeWidth / 2;
      
      ctx.beginPath();
      ctx.moveTo(firstChildCenterX, midY);
      ctx.lineTo(lastChildCenterX, midY);
      ctx.stroke();
      
      // Points aux extrémités
      ctx.beginPath();
      ctx.arc(firstChildCenterX, midY, 4, 0, Math.PI * 2);
      ctx.fillStyle = TREE_CONFIG.colors.linkColor;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(lastChildCenterX, midY, 4, 0, Math.PI * 2);
      ctx.fillStyle = TREE_CONFIG.colors.linkColor;
      ctx.fill();
    }
    
    // Lignes courbes vers chaque enfant
    node.children.forEach(child => {
      const childCenterX = child.spouse ?
        (child.person.x + child.spouse.x + TREE_CONFIG.nodeWidth) / 2 :
        child.person.x + TREE_CONFIG.nodeWidth / 2;
      const childTopY = child.person.y;
      
      ctx.beginPath();
      ctx.moveTo(childCenterX, midY);
      ctx.lineTo(childCenterX, childTopY);
      ctx.stroke();
      
      // Point de connexion en haut de l'enfant
      ctx.beginPath();
      ctx.arc(childCenterX, childTopY, 4, 0, Math.PI * 2);
      ctx.fillStyle = TREE_CONFIG.colors.linkColor;
      ctx.fill();
      
      // Récursif pour les descendants
      drawTreeLinks(ctx, child);
    });
  }
}

/**
 * Fonction principale : dessiner l'arbre complet à partir d'une personne
 */
function drawCompleteTreeFromPerson(ctx, canvas, people, relations, centralPersonId) {
  console.log('=== drawCompleteTreeFromPerson ===');
  console.log('Personne centrale:', centralPersonId);
  
  // 1. Construire la structure de l'arbre
  const treeData = buildCompleteTreeFromPerson(people, relations, centralPersonId);
  
  if (!treeData || !treeData.root) {
    console.error('Impossible de construire l\'arbre');
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText('Impossible de construire l\'arbre', 50, 50);
    return;
  }
  
  console.log('Arbre construit');
  
  // 2. Calculer les largeurs
  calculateNodeWidths(treeData.root);
  console.log('Largeur racine:', treeData.root.width);
  
  // 3. Calculer les dimensions du canvas
  const canvasWidth = Math.max(1400, treeData.root.width + 200, window.innerWidth - 100);
  const centerX = canvasWidth / 2;
  
  // Position temporaire pour calculer les bounds
  const tempCenterY = 300;
  
  // Positionner tous les nœuds avec position temporaire
  positionNodes(treeData.root, centerX, tempCenterY);
  
  // Calculer les bounds réels
  const bounds = calculateTreeBounds(treeData.root);
  console.log('Bounds:', bounds);
  
  // Ajuster centerY pour que tout soit visible avec une marge
  const margin = 50;
  const adjustedCenterY = tempCenterY - bounds.minY + margin;
  const canvasHeight = bounds.maxY - bounds.minY + margin * 2;
  
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  
  console.log('Canvas dimensions:', canvasWidth, 'x', canvasHeight);
  console.log('Centre ajusté:', centerX, adjustedCenterY);
  
  // 4. Fond blanc élégant
  ctx.fillStyle = '#fafbfc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 5. Repositionner avec le bon centerY
  positionNodes(treeData.root, centerX, adjustedCenterY);
  
  // 6. Collecter toutes les personnes
  const allNodes = collectAllNodesFromTree(treeData.root);
  console.log('Total personnes à dessiner:', allNodes.length);
  
  // 7. Dessiner les liens
  drawTreeLinks(ctx, treeData.root);
  
  // 8. Dessiner les nœuds
  allNodes.forEach(person => {
    drawNode(ctx, person);
  });
  
  console.log('=== Dessin terminé ===');
  
  // 9. Gestion du clic
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    for (const person of allNodes) {
      if (x >= person.x && x <= person.x + TREE_CONFIG.nodeWidth &&
          y >= person.y && y <= person.y + TREE_CONFIG.nodeHeight) {
        // Si le mode édition est actif, ouvrir directement l'éditeur
        if (typeof editMode !== 'undefined' && editMode) {
          editPerson(person.id);
        } else {
          // Sinon, afficher les détails en lecture seule
          showPersonDetail(person.id);
        }
        return;
      }
    }
  };
}

// Export des fonctions pour app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { drawTreeCanvas, drawCompleteTreeFromPerson, TREE_CONFIG };
}
