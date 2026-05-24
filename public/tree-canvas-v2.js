/**
 * Module Canvas pour l'arbre généalogique - VERSION 3 - Algorithme par indices
 * Construction séquentielle : fratrie → conjoints → enfants → parents
 * Assignation d'indices X avant positionnement
 */

// Configuration graphique
const TREE_CONFIG = {
  nodeWidth: 200,
  nodeHeight: 100,
  horizontalSpacing: 50,
  siblingSpacing: 30,
  generationSpacing: 200,
  spouseVerticalOffset: 110,
  fontSize: 13,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  colors: {
    nodeBg: '#ffffff',
    nodeText: '#333333',
    linkColor: '#d0d0d0',
    maleBorder: '#4A90E2',
    femaleBorder: '#E91E63',
    statusAlive: '#4CAF50',
    statusDeceased: '#999999'
  }
};

/**
 * Construire l'arbre avec assignation d'indices X
 */
function buildCompleteTreeFromPerson(people, relations, unions, unionChildren, centralPersonId) {
  console.log('=== Construction arbre - Algorithme par indices ===');
  console.log('Personne centrale:', centralPersonId);
  
  // Créer les maps de relations
  const personMap = new Map(people.map(p => [p.id, p]));
  const parentsMap = new Map();
  const childrenMap = new Map();
  const spousesMap = new Map();
  const siblingsMap = new Map();
  const unionMap = new Map();
  const unionChildrenMap = new Map();
  
  // Construire les maps à partir des unions
  unions.forEach(union => {
    if (union.person1_id && union.person2_id) {
      if (!spousesMap.has(union.person1_id)) spousesMap.set(union.person1_id, []);
      if (!spousesMap.has(union.person2_id)) spousesMap.set(union.person2_id, []);
      spousesMap.get(union.person1_id).push(union.person2_id);
      spousesMap.get(union.person2_id).push(union.person1_id);
      
      unionMap.set(`${union.person1_id}_${union.person2_id}`, union.id);
      unionMap.set(`${union.person2_id}_${union.person1_id}`, union.id);
    }
  });
  
  unionChildren.forEach(uc => {
    if (!unionChildrenMap.has(uc.union_id)) {
      unionChildrenMap.set(uc.union_id, []);
    }
    unionChildrenMap.get(uc.union_id).push(uc.child_id);
    
    const union = unions.find(u => u.id === uc.union_id);
    if (union) {
      if (!parentsMap.has(uc.child_id)) parentsMap.set(uc.child_id, []);
      [union.person1_id, union.person2_id].forEach(parentId => {
        if (parentId && !parentsMap.get(uc.child_id).includes(parentId)) {
          parentsMap.get(uc.child_id).push(parentId);
        }
      });
      
      [union.person1_id, union.person2_id].forEach(parentId => {
        if (parentId) {
          if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
          if (!childrenMap.get(parentId).includes(uc.child_id)) {
            childrenMap.get(parentId).push(uc.child_id);
          }
        }
      });
    }
  });
  
  // Construire siblingsMap
  unionChildren.forEach(uc1 => {
    unionChildren.forEach(uc2 => {
      if (uc1.union_id === uc2.union_id && uc1.child_id !== uc2.child_id) {
        if (!siblingsMap.has(uc1.child_id)) siblingsMap.set(uc1.child_id, []);
        if (!siblingsMap.get(uc1.child_id).includes(uc2.child_id)) {
          siblingsMap.get(uc1.child_id).push(uc2.child_id);
        }
      }
    });
  });
  
  console.log('Maps construites');
  
  // Structure pour stocker les générations avec indices X
  const generations = new Map(); // generation_number -> [{personId, type: 'person'|'spouse', xIndex}]
  const generationNumbers = new Map(); // personId -> generation_number
  const processed = new Set();
  
  /**
   * Construire une génération avec indices X séquentiels
   */
  function buildGeneration(startPersonId, genNumber) {
    if (!generations.has(genNumber)) {
      generations.set(genNumber, []);
    }
    
    const genList = generations.get(genNumber);
    let currentXIndex = genList.length;
    
    // Étape 1: Trouver la fratrie
    const siblings = siblingsMap.get(startPersonId) || [];
    const fratrie = [startPersonId, ...siblings].filter(id => !processed.has(id));
    
    // Trier par date de naissance
    fratrie.sort((a, b) => {
      const personA = personMap.get(a);
      const personB = personMap.get(b);
      if (!personA || !personB) return 0;
      const dateA = personA.date_naissance ? new Date(personA.date_naissance) : new Date(0);
      const dateB = personB.date_naissance ? new Date(personB.date_naissance) : new Date(0);
      return dateA - dateB;
    });
    
    console.log(`Génération ${genNumber}: fratrie de ${fratrie.length} personnes`);
    
    // Étape 2: Pour chaque membre de la fratrie
    fratrie.forEach(personId => {
      if (processed.has(personId)) return;
      
      processed.add(personId);
      generationNumbers.set(personId, genNumber);
      
      // Ajouter la personne
      genList.push({ personId: personId, type: 'person', xIndex: currentXIndex++ });
      console.log(`  X${currentXIndex - 1}: ${personMap.get(personId)?.prenom}`);
      
      // Étape 3: Ajouter les conjoints de cette personne
      const spouseIds = spousesMap.get(personId) || [];
      spouseIds.forEach(spouseId => {
        if (!processed.has(spouseId)) {
          processed.add(spouseId);
          generationNumbers.set(spouseId, genNumber);
          genList.push({ personId: spouseId, type: 'spouse', xIndex: currentXIndex++ });
          console.log(`  X${currentXIndex - 1}: ${personMap.get(spouseId)?.prenom} (conjoint)`);
        }
      });
    });
    
    return fratrie;
  }
  
  /**
   * Construire récursivement les descendants
   */
  function buildDescendants(personIds, currentGen) {
    const childrenToProcess = new Set();
    
    personIds.forEach(personId => {
      const children = childrenMap.get(personId) || [];
      children.forEach(childId => {
        if (!processed.has(childId)) {
          childrenToProcess.add(childId);
        }
      });
    });
    
    if (childrenToProcess.size > 0) {
      console.log(`Traitement de ${childrenToProcess.size} enfants à la génération ${currentGen + 1}`);
      
      // Grouper les enfants par fratrie (mêmes parents)
      const fratrieGroups = new Map();
      childrenToProcess.forEach(childId => {
        const parents = parentsMap.get(childId) || [];
        const parentKey = parents.sort().join('_');
        if (!fratrieGroups.has(parentKey)) {
          fratrieGroups.set(parentKey, []);
        }
        fratrieGroups.get(parentKey).push(childId);
      });
      
      // Construire chaque fratrie
      const allChildren = [];
      fratrieGroups.forEach(fratrie => {
        const built = buildGeneration(fratrie[0], currentGen + 1);
        allChildren.push(...built);
      });
      
      // Récursif sur les enfants
      if (allChildren.length > 0) {
        buildDescendants(allChildren, currentGen + 1);
      }
    }
  }
  
  /**
   * Construire récursivement les ancêtres
   */
  function buildAncestors(personIds, currentGen) {
    const parentsToProcess = new Set();
    
    personIds.forEach(personId => {
      const parents = parentsMap.get(personId) || [];
      parents.forEach(parentId => {
        if (!processed.has(parentId)) {
          parentsToProcess.add(parentId);
        }
      });
    });
    
    if (parentsToProcess.size > 0) {
      console.log(`Traitement de ${parentsToProcess.size} parents à la génération ${currentGen - 1}`);
      
      // Grouper les parents par couple (même union)
      const coupleGroups = new Map();
      parentsToProcess.forEach(parentId => {
        const spouses = spousesMap.get(parentId) || [];
        const spouse = spouses.find(sid => parentsToProcess.has(sid));
        
        if (spouse) {
          const coupleKey = [parentId, spouse].sort().join('_');
          if (!coupleGroups.has(coupleKey)) {
            coupleGroups.set(coupleKey, [parentId, spouse]);
          }
        } else {
          coupleGroups.set(`single_${parentId}`, [parentId]);
        }
      });
      
      // Construire chaque couple/parent
      const allParents = [];
      coupleGroups.forEach(couple => {
        const built = buildGeneration(couple[0], currentGen - 1);
        allParents.push(...built);
      });
      
      // Récursif sur les parents
      if (allParents.length > 0) {
        buildAncestors(allParents, currentGen - 1);
      }
    }
  }
  
  // Commencer par la personne centrale à la génération 0
  console.log('=== Construction depuis la personne centrale ===');
  const centralFratrie = buildGeneration(centralPersonId, 0);
  
  // Construire les descendants
  console.log('=== Construction des descendants ===');
  buildDescendants(centralFratrie, 0);
  
  // Construire les ancêtres
  console.log('=== Construction des ancêtres ===');
  buildAncestors(centralFratrie, 0);
  
  console.log(`Total personnes traitées: ${processed.size}`);
  
  return {
    generations,
    generationNumbers,
    personMap,
    parentsMap,
    childrenMap,
    spousesMap,
    unionMap,
    unionChildrenMap
  };
}

/**
 * Construire la structure par groupes/fratries avec identifiants
 * Logique corrigée :
 * - Un groupe UNION = un couple (éviter doublons)
 * - Un groupe FRATRIE = enfants d'une MÈRE spécifique
 */
function buildGroupStructure(people, relations, unions, unionChildren, centralPersonId) {
  const personMap = new Map(people.map(p => [p.id, p]));
  const parentsMap = new Map(); // personId -> [parentIds]
  const unionChildrenMap = new Map(); // unionId -> [childIds]
  const motherChildrenMap = new Map(); // motherId -> [{unionId, childIds}]
  
  // Construire les maps
  unionChildren.forEach(uc => {
    if (!unionChildrenMap.has(uc.union_id)) {
      unionChildrenMap.set(uc.union_id, []);
    }
    unionChildrenMap.get(uc.union_id).push(uc.child_id);
    
    // Trouver les parents
    const union = unions.find(u => u.id === uc.union_id);
    if (union) {
      if (!parentsMap.has(uc.child_id)) {
        parentsMap.set(uc.child_id, []);
      }
      parentsMap.get(uc.child_id).push(union.person1_id, union.person2_id);
      
      // Grouper par mère (person2 est généralement la mère)
      const motherId = union.person2_id;
      if (!motherChildrenMap.has(motherId)) {
        motherChildrenMap.set(motherId, []);
      }
      motherChildrenMap.get(motherId).push({
        unionId: union.id,
        childIds: [uc.child_id]
      });
    }
  });
  
  // Consolider les enfants par mère
  motherChildrenMap.forEach((entries, motherId) => {
    const consolidatedByUnion = new Map();
    entries.forEach(entry => {
      if (!consolidatedByUnion.has(entry.unionId)) {
        consolidatedByUnion.set(entry.unionId, []);
      }
      consolidatedByUnion.get(entry.unionId).push(...entry.childIds);
    });
    motherChildrenMap.set(motherId, Array.from(consolidatedByUnion.entries()).map(([unionId, childIds]) => ({
      unionId,
      childIds: [...new Set(childIds)]
    })));
  });
  
  // Structure des groupes
  const groups = [];
  let groupIdCounter = 1;
  const unionToGroup = new Map(); // unionId -> groupId
  const processedUnions = new Set();
  const processedChildren = new Set();
  
  // Fonction pour créer un groupe UNION (éviter doublons)
  function createUnionGroup(union, parentGroupId = null) {
    if (processedUnions.has(union.id)) {
      return unionToGroup.get(union.id);
    }
    
    processedUnions.add(union.id);
    const groupId = groupIdCounter++;
    unionToGroup.set(union.id, groupId);
    
    const person1 = personMap.get(union.person1_id);
    const person2 = personMap.get(union.person2_id);
    
    const name1 = `${person1.prenom} ${person1.nom || ''}`.trim();
    const name2 = `${person2.prenom} ${person2.nom || ''}`.trim();
    
    // Déterminer le statut du conjoint
    const spouseStatus = person2.sexe === 'F' ? 'épouse' : 'époux';
    
    groups.push({
      id: groupId,
      parents: parentGroupId,
      type: 'union',
      unionId: union.id,
      members: [
        {
          id_personne: union.person1_id,
          name: name1
        },
        {
          id_personne: union.person2_id,
          name: name2,
          statut: spouseStatus
        }
      ]
    });
    
    return groupId;
  }
  
  // Fonction pour créer un groupe FRATRIE (enfants d'une MÈRE)
  function createChildrenFratrieGroup(childrenIds, motherUnionGroupId, unionId) {
    if (childrenIds.length === 0) return null;
    
    const groupId = groupIdCounter++;
    const members = [];
    
    // Trouver l'union pour obtenir père et mère
    const parentUnion = unions.find(u => u.id === unionId);
    
    // Trier par date de naissance
    const sortedIds = [...childrenIds].sort((a, b) => {
      const dateA = personMap.get(a)?.date_naissance ? new Date(personMap.get(a).date_naissance) : new Date(0);
      const dateB = personMap.get(b)?.date_naissance ? new Date(personMap.get(b).date_naissance) : new Date(0);
      return dateA - dateB;
    });
    
    sortedIds.forEach(childId => {
      if (processedChildren.has(childId)) return;
      processedChildren.add(childId);
      
      // Trouver les unions de cet enfant
      const childUnions = unions.filter(u => 
        u.person1_id === childId || u.person2_id === childId
      );
      
      if (childUnions.length > 0) {
        // Créer un groupe union pour chaque union de cet enfant
        childUnions.forEach(childUnion => {
          const childUnionGroupId = createUnionGroup(childUnion, groupId);
          members.push({ reference_groupe: childUnionGroupId });
        });
      } else {
        // Pas d'union - mettre l'objet personne
        const child = personMap.get(childId);
        const childName = `${child.prenom} ${child.nom || ''}`.trim();
        members.push({
          id_personne: childId,
          name: childName
        });
      }
    });
    
    groups.push({
      id: groupId,
      parents: motherUnionGroupId,
      type: 'fratrie',
      pere_id: parentUnion ? parentUnion.person1_id : null,
      mere_id: parentUnion ? parentUnion.person2_id : null,
      members: members
    });
    
    return groupId;
  }
  
  // Trouver les unions racines (personnes sans parents)
  const rootUnions = unions.filter(union => {
    const person1HasParents = parentsMap.has(union.person1_id) && parentsMap.get(union.person1_id).length > 0;
    const person2HasParents = parentsMap.has(union.person2_id) && parentsMap.get(union.person2_id).length > 0;
    return !person1HasParents && !person2HasParents;
  });
  
  // Traiter chaque union racine
  const queue = [];
  rootUnions.forEach(rootUnion => {
    const unionGroupId = createUnionGroup(rootUnion, null);
    
    // Créer des groupes fratrie par MÈRE
    const motherId = rootUnion.person2_id;
    const motherEntries = motherChildrenMap.get(motherId) || [];
    
    motherEntries.forEach(entry => {
      if (entry.unionId === rootUnion.id && entry.childIds.length > 0) {
        const fratrieGroupId = createChildrenFratrieGroup(entry.childIds, unionGroupId, entry.unionId);
        if (fratrieGroupId) {
          queue.push({ childrenIds: entry.childIds, fratrieGroupId });
        }
      }
    });
  });
  
  // Traiter les descendants niveau par niveau
  while (queue.length > 0) {
    const { childrenIds, fratrieGroupId } = queue.shift();
    
    childrenIds.forEach(childId => {
      const childUnions = unions.filter(u => 
        u.person1_id === childId || u.person2_id === childId
      );
      
      childUnions.forEach(childUnion => {
        if (processedUnions.has(childUnion.id)) return;
        
        const childUnionGroupId = createUnionGroup(childUnion, fratrieGroupId);
        
        // Créer des groupes fratrie pour chaque mère de cette union
        const motherId = childUnion.person2_id;
        const motherEntries = motherChildrenMap.get(motherId) || [];
        
        motherEntries.forEach(entry => {
          if (entry.unionId === childUnion.id && entry.childIds.length > 0) {
            const grandFratrieGroupId = createChildrenFratrieGroup(entry.childIds, childUnionGroupId, entry.unionId);
            if (grandFratrieGroupId) {
              queue.push({ childrenIds: entry.childIds, fratrieGroupId: grandFratrieGroupId });
            }
          }
        });
      });
    });
  }
  
  return groups;
}

/**
 * Afficher la structure par groupes/fratries
 */
function displayTreeStructureAsText(people, relations, unions, unionChildren, centralPersonId) {
  console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║       STRUCTURE DE L\'ARBRE PAR GROUPES/FRATRIES         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  const groups = buildGroupStructure(people, relations, unions, unionChildren, centralPersonId);
  
  console.log(`📊 TOTAL: ${groups.length} groupes\n`);
  console.log('═'.repeat(80));
  
  groups.forEach(group => {
    const parentLabel = group.parents === null ? 'NULL' : `gr:${group.parents}`;
    const typeLabel = group.type === 'union' ? '💑 UNION' : '👥 FRATRIE';
    
    if (group.type === 'fratrie') {
      console.log(`\n[ gr:${group.id}, parents: ${parentLabel}, type: ${typeLabel}, père: ${group.pere_id}, mère: ${group.mere_id},`);
    } else {
      console.log(`\n[ gr:${group.id}, parents: ${parentLabel}, type: ${typeLabel},`);
    }
    
    if (Array.isArray(group.members)) {
      group.members.forEach((member, idx) => {
        const indent = '    ';
        const comma = idx < group.members.length - 1 ? ',' : '';
        
        // Afficher selon le type de membre
        if (typeof member === 'object') {
          if (member.reference_groupe) {
            console.log(`${indent}gr:${member.reference_groupe}${comma}`);
          } else {
            const statutStr = member.statut ? `, statut: "${member.statut}"` : '';
            console.log(`${indent}{ id_personne: ${member.id_personne}, name: "${member.name}"${statutStr} }${comma}`);
          }
        } else {
          console.log(`${indent}${member}${comma}`);
        }
      });
    }
    
    console.log(']');
  });
  
  console.log('\n' + '═'.repeat(80));
  console.log('✅ Affichage terminé\n\n');
}

/**
 * Exporter la structure de l'arbre en JSON pour debug
 */
function exportTreeStructureAsJSON(people, relations, unions, unionChildren, centralPersonId) {
  console.log('=== Export structure JSON ===');
  
  // D'abord afficher en format texte simple
  displayTreeStructureAsText(people, relations, unions, unionChildren, centralPersonId);
  
  // Construire la structure par groupes
  const groups = buildGroupStructure(people, relations, unions, unionChildren, centralPersonId);
  
  // Retourner TOUTES les propriétés des groupes
  const jsonStructure = {
    totalGroupes: groups.length,
    groupes: groups // Retourner les groupes complets sans filtrage
  };
  
  return jsonStructure;
}

/**
 * Positionner tous les nœuds en utilisant les indices X calculés
 */
function positionAllNodes(treeData, canvasWidth) {
  const { generations, generationNumbers, personMap } = treeData;
  
  // Trier les générations
  const genList = Array.from(generations.keys()).sort((a, b) => a - b);
  
  // Calculer Y pour chaque génération
  const genYMap = new Map();
  genList.forEach((gen, idx) => {
    genYMap.set(gen, 50 + idx * TREE_CONFIG.generationSpacing);
  });
  
  // Map pour stocker les positions finales
  const positions = new Map(); // personId -> {x, y, type}
  
  // Pour chaque génération, calculer les positions X réelles
  genList.forEach(gen => {
    const genList = generations.get(gen) || [];
    const y = genYMap.get(gen);
    
    // Calculer la largeur totale nécessaire
    const totalSlots = genList.length;
    const totalWidth = totalSlots * (TREE_CONFIG.nodeWidth + TREE_CONFIG.siblingSpacing);
    
    // Centrer sur le canvas
    const startX = (canvasWidth - totalWidth) / 2;
    
    // Positionner chaque personne/conjoint
    genList.forEach((item, idx) => {
      const x = startX + idx * (TREE_CONFIG.nodeWidth + TREE_CONFIG.siblingSpacing);
      const yPos = item.type === 'spouse' ? y + TREE_CONFIG.spouseVerticalOffset : y;
      
      positions.set(item.personId, {
        x: x,
        y: yPos,
        type: item.type,
        xIndex: item.xIndex
      });
      
      console.log(`Gen ${gen}, X${item.xIndex}: ${personMap.get(item.personId)?.prenom} à (${Math.round(x)}, ${Math.round(yPos)})`);
    });
  });
  
  return { positions, genYMap };
}

/**
 * Dessiner l'arbre complet
 */
function drawCompleteTreeFromPerson(ctx, canvas, people, relations, unions, unionChildren, centralPersonId) {
  console.log('=== Dessin arbre complet ===');
  
  // Phase 1: Construire avec indices
  const treeData = buildCompleteTreeFromPerson(people, relations, unions, unionChildren, centralPersonId);
  
  // Phase 2: Positionner avec les indices
  const { positions, genYMap } = positionAllNodes(treeData, canvas.width);
  
  // Ajuster la taille du canvas
  const maxY = Math.max(...Array.from(positions.values()).map(p => p.y + TREE_CONFIG.nodeHeight));
  const maxX = Math.max(...Array.from(positions.values()).map(p => p.x + TREE_CONFIG.nodeWidth));
  canvas.height = Math.max(maxY + 100, 800);
  canvas.width = Math.max(maxX + 100, canvas.width);
  
  // Fond
  ctx.fillStyle = '#f9f9f9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const { personMap, parentsMap, spousesMap, unionMap, unionChildrenMap } = treeData;
  
  // Phase 3: Dessiner toutes les personnes
  positions.forEach((pos, personId) => {
    const person = personMap.get(personId);
    if (person) {
      drawPersonCard(ctx, person, pos.x, pos.y, personId === centralPersonId);
    }
  });
  
  // Phase 4: Dessiner les liens de mariage (peigne horizontal)
  const drawnMarriages = new Set();
  positions.forEach((pos, personId) => {
    const spouseIds = spousesMap.get(personId) || [];
    
    spouseIds.forEach(spouseId => {
      const marriageKey = [personId, spouseId].sort().join('_');
      if (drawnMarriages.has(marriageKey)) return;
      drawnMarriages.add(marriageKey);
      
      const spousePos = positions.get(spouseId);
      if (!spousePos) return;
      
      // Le parent principal (celui qui n'est pas 'spouse')
      const isPersonMain = pos.type === 'person';
      const mainPos = isPersonMain ? pos : spousePos;
      const spouseActualPos = isPersonMain ? spousePos : pos;
      
      // Ligne horizontale du peigne
      const personRightX = mainPos.x + TREE_CONFIG.nodeWidth;
      const personCenterY = mainPos.y + TREE_CONFIG.nodeHeight / 2;
      const spouseCenterX = spouseActualPos.x + TREE_CONFIG.nodeWidth / 2;
      const spouseTopY = spouseActualPos.y;
      
      ctx.strokeStyle = TREE_CONFIG.colors.linkColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(personRightX, personCenterY);
      ctx.lineTo(spouseCenterX, personCenterY);
      ctx.stroke();
      
      // Ligne verticale vers le conjoint
      ctx.beginPath();
      ctx.moveTo(spouseCenterX, personCenterY);
      ctx.lineTo(spouseCenterX, spouseTopY);
      ctx.stroke();
      
      // Icône mariage
      const allianceY = (personCenterY + spouseTopY) / 2;
      ctx.beginPath();
      ctx.arc(spouseCenterX, allianceY, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700';
      ctx.fill();
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.font = 'bold 16px ' + TREE_CONFIG.fontFamily;
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('💍', spouseCenterX, allianceY + 5);
      
      ctx.strokeStyle = TREE_CONFIG.colors.linkColor;
      ctx.lineWidth = 2.5;
      
      // Dessiner les liens vers les enfants de cette union
      const unionKey = `${personId}_${spouseId}`;
      const unionId = unionMap.get(unionKey);
      if (unionId) {
        const childrenIds = unionChildrenMap.get(unionId) || [];
        if (childrenIds.length > 0) {
          const childrenPos = childrenIds.map(cid => positions.get(cid)).filter(p => p);
          
          if (childrenPos.length > 0) {
            const spouseRightX = spouseActualPos.x + TREE_CONFIG.nodeWidth;
            const spouseBottomY = spouseActualPos.y + TREE_CONFIG.nodeHeight;
            const firstChildY = childrenPos[0].y;
            const linkMidY = (spouseBottomY + firstChildY) / 2;
            
            // Ligne horizontale de la mère vers la droite
            const firstChildCenterX = childrenPos[0].x + TREE_CONFIG.nodeWidth / 2;
            ctx.beginPath();
            ctx.moveTo(spouseRightX, spouseBottomY + TREE_CONFIG.nodeHeight / 4);
            ctx.lineTo(firstChildCenterX, spouseBottomY + TREE_CONFIG.nodeHeight / 4);
            ctx.lineTo(firstChildCenterX, linkMidY);
            ctx.stroke();
            
            // Ligne horizontale entre les enfants
            if (childrenPos.length > 1) {
              const lastChildCenterX = childrenPos[childrenPos.length - 1].x + TREE_CONFIG.nodeWidth / 2;
              ctx.beginPath();
              ctx.moveTo(firstChildCenterX, linkMidY);
              ctx.lineTo(lastChildCenterX, linkMidY);
              ctx.stroke();
            }
            
            // Lignes verticales vers chaque enfant
            childrenPos.forEach(childPos => {
              const childCenterX = childPos.x + TREE_CONFIG.nodeWidth / 2;
              ctx.beginPath();
              ctx.moveTo(childCenterX, linkMidY);
              ctx.lineTo(childCenterX, childPos.y);
              ctx.stroke();
            });
          }
        }
      }
    });
  });
  
  // Phase 5: Dessiner les liens parents-enfants (fratries)
  const fratrieGroups = new Map();
  positions.forEach((pos, personId) => {
    const parents = parentsMap.get(personId) || [];
    if (parents.length > 0) {
      const parentKey = parents.sort().join('_');
      if (!fratrieGroups.has(parentKey)) {
        fratrieGroups.set(parentKey, []);
      }
      fratrieGroups.get(parentKey).push(personId);
    }
  });
  
  fratrieGroups.forEach((childIds, parentKey) => {
    const childrenPos = childIds.map(id => positions.get(id)).filter(p => p);
    if (childrenPos.length === 0) return;
    
    const parentIds = parentKey.split('_').map(id => parseInt(id));
    const parentsPos = parentIds.map(id => positions.get(id)).filter(p => p);
    if (parentsPos.length === 0) return;
    
    if (childrenPos.length === 1) {
      // Un seul enfant - lien simple
      const childPos = childrenPos[0];
      const parentPos = parentsPos[0];
      drawParentChildLink(ctx, parentPos, childPos);
    } else {
      // Plusieurs enfants - peigne horizontal
      const fratrieTopY = childrenPos[0].y - 40;
      const leftmostX = Math.min(...childrenPos.map(p => p.x));
      const rightmostX = Math.max(...childrenPos.map(p => p.x + TREE_CONFIG.nodeWidth));
      
      ctx.strokeStyle = TREE_CONFIG.colors.linkColor;
      ctx.lineWidth = 2.5;
      
      // Ligne horizontale au-dessus de la fratrie
      ctx.beginPath();
      ctx.moveTo(leftmostX + TREE_CONFIG.nodeWidth / 2, fratrieTopY);
      ctx.lineTo(rightmostX - TREE_CONFIG.nodeWidth / 2, fratrieTopY);
      ctx.stroke();
      
      // Lignes verticales de chaque enfant
      childrenPos.forEach(childPos => {
        const childCenterX = childPos.x + TREE_CONFIG.nodeWidth / 2;
        ctx.beginPath();
        ctx.moveTo(childCenterX, childPos.y);
        ctx.lineTo(childCenterX, fratrieTopY);
        ctx.stroke();
      });
      
      // Ligne vers les parents
      const fratrieCenterX = (leftmostX + rightmostX) / 2;
      
      if (parentsPos.length === 2) {
        const parentCenterX = (parentsPos[0].x + parentsPos[1].x + TREE_CONFIG.nodeWidth) / 2;
        const parentBottomY = Math.max(parentsPos[0].y, parentsPos[1].y) + TREE_CONFIG.nodeHeight;
        
        // Ligne horizontale entre les parents
        const parent1RightX = parentsPos[0].x + TREE_CONFIG.nodeWidth;
        const parent2LeftX = parentsPos[1].x;
        const parent1CenterY = parentsPos[0].y + TREE_CONFIG.nodeHeight / 2;
        
        ctx.beginPath();
        ctx.moveTo(parent1RightX, parent1CenterY);
        ctx.lineTo(parent2LeftX, parent1CenterY);
        ctx.stroke();
        
        // Icône mariage
        const marriageCenterX = (parent1RightX + parent2LeftX) / 2;
        ctx.font = 'bold 16px ' + TREE_CONFIG.fontFamily;
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('💍', marriageCenterX, parent1CenterY + 5);
        
        // Ligne vers la fratrie
        ctx.strokeStyle = TREE_CONFIG.colors.linkColor;
        ctx.beginPath();
        ctx.moveTo(fratrieCenterX, fratrieTopY);
        ctx.lineTo(fratrieCenterX, (fratrieTopY + parentBottomY) / 2);
        ctx.lineTo(parentCenterX, (fratrieTopY + parentBottomY) / 2);
        ctx.lineTo(parentCenterX, parentBottomY);
        ctx.stroke();
      } else {
        const parentPos = parentsPos[0];
        const parentCenterX = parentPos.x + TREE_CONFIG.nodeWidth / 2;
        const parentBottomY = parentPos.y + TREE_CONFIG.nodeHeight;
        
        ctx.beginPath();
        ctx.moveTo(fratrieCenterX, fratrieTopY);
        ctx.lineTo(fratrieCenterX, (fratrieTopY + parentBottomY) / 2);
        ctx.lineTo(parentCenterX, (fratrieTopY + parentBottomY) / 2);
        ctx.lineTo(parentCenterX, parentBottomY);
        ctx.stroke();
      }
    }
  });
  
  console.log('Arbre dessiné:', positions.size, 'personnes');
}

/**
 * Dessiner une carte de personne
 */
function drawPersonCard(ctx, person, x, y, isSelected = false) {
  // Fond de la carte
  ctx.fillStyle = TREE_CONFIG.colors.nodeBg;
  ctx.fillRect(x, y, TREE_CONFIG.nodeWidth, TREE_CONFIG.nodeHeight);
  
  // Bordure
  ctx.strokeStyle = person.sexe === 'M' ? TREE_CONFIG.colors.maleBorder : TREE_CONFIG.colors.femaleBorder;
  ctx.lineWidth = isSelected ? 4 : 2;
  ctx.strokeRect(x, y, TREE_CONFIG.nodeWidth, TREE_CONFIG.nodeHeight);
  
  // Texte
  ctx.fillStyle = TREE_CONFIG.colors.nodeText;
  ctx.font = `bold ${TREE_CONFIG.fontSize}px ${TREE_CONFIG.fontFamily}`;
  ctx.textAlign = 'center';
  
  const prenom = person.prenom || '?';
  const nom = person.nom || '?';
  
  ctx.fillText(prenom, x + TREE_CONFIG.nodeWidth / 2, y + 30);
  ctx.fillText(nom, x + TREE_CONFIG.nodeWidth / 2, y + 50);
  
  // Dates
  ctx.font = `${TREE_CONFIG.fontSize - 2}px ${TREE_CONFIG.fontFamily}`;
  const dateNaiss = person.date_naissance ? new Date(person.date_naissance).getFullYear() : '?';
  const dateDeces = person.date_deces ? new Date(person.date_deces).getFullYear() : (person.vivant ? '' : '?');
  ctx.fillText(`${dateNaiss} - ${dateDeces}`, x + TREE_CONFIG.nodeWidth / 2, y + 70);
}

/**
 * Dessiner un lien parent-enfant
 */
function drawParentChildLink(ctx, parentPos, childPos) {
  ctx.strokeStyle = TREE_CONFIG.colors.linkColor;
  ctx.lineWidth = 2.5;
  
  const parentX = parentPos.x + TREE_CONFIG.nodeWidth / 2;
  const parentY = parentPos.y + TREE_CONFIG.nodeHeight;
  const childX = childPos.x + TREE_CONFIG.nodeWidth / 2;
  const childY = childPos.y;
  
  const midY = (parentY + childY) / 2;
  
  ctx.beginPath();
  ctx.moveTo(parentX, parentY);
  ctx.lineTo(parentX, midY);
  ctx.lineTo(childX, midY);
  ctx.lineTo(childX, childY);
  ctx.stroke();
}
