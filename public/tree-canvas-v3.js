// ====================================================================
// TREE-CANVAS-V3.JS - Version avec table parents
// Structure simplifiée : persons + parents
// ====================================================================

const TREE_CONFIG = {
  nodeWidth: 200,
  nodeHeight: 100,
  horizontalSpacing: 80,
  siblingSpacing: 40,
  generationSpacing: 220,
  spouseVerticalOffset: 110,
  fontSize: 13,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  colors: {
    nodeBg: '#ffffff',
    nodeText: '#333333',
    linkColor: '#d0d0d0',
    maleBorder: '#4A90E2',
    femaleBorder: '#E91E63'
  }
};

/**
 * Construire la structure par groupes depuis la nouvelle table parents
 */
function buildGroupStructure(people, parents, centralPersonId) {
  const personMap = new Map(people.map(p => [p.id, p]));
  const groups = [];
  let groupIdCounter = 1;
  
  // Map parent_id -> group_id pour éviter duplicates
  const parentToGroup = new Map();
  const processedParents = new Set();
  
  /**
   * Créer un groupe UNION (couple)
   */
  function createUnionGroup(parent, parentGroupId = null) {
    if (processedParents.has(parent.id)) {
      return parentToGroup.get(parent.id);
    }
    
    processedParents.add(parent.id);
    const groupId = groupIdCounter++;
    parentToGroup.set(parent.id, groupId);
    
    const pere = personMap.get(parent.id_pere);
    const mere = personMap.get(parent.id_mere);
    
    const name_pere = `${pere.prenom} ${pere.nom || ''}`.trim();
    const name_mere = `${mere.prenom} ${mere.nom || ''}`.trim();
    
    const spouseStatus = mere.sexe === 'F' ? 'épouse' : 'époux';
    
    groups.push({
      id: groupId,
      parents: parentGroupId,
      type: 'union',
      parent_id: parent.id,
      members: [
        {
          id_personne: parent.id_pere,
          name: name_pere
        },
        {
          id_personne: parent.id_mere,
          name: name_mere,
          statut: spouseStatus
        }
      ]
    });
    
    return groupId;
  }
  
  /**
   * Créer un groupe FRATRIE (enfants)
   */
  function createChildrenFratrieGroup(childrenIds, parentUnionGroupId, parentId) {
    if (childrenIds.length === 0) return null;
    
    const groupId = groupIdCounter++;
    const parent = parents.find(p => p.id === parentId);
    const members = [];
    
    // Trier par date de naissance
    const sortedIds = [...childrenIds].sort((a, b) => {
      const dateA = personMap.get(a)?.date_naissance ? new Date(personMap.get(a).date_naissance) : new Date(0);
      const dateB = personMap.get(b)?.date_naissance ? new Date(personMap.get(b).date_naissance) : new Date(0);
      return dateA - dateB;
    });
    
    sortedIds.forEach(childId => {
      // Vérifier si cet enfant est lui-même parent (a des enfants)
      const childAsParent = parents.find(p => p.id_pere === childId || p.id_mere === childId);
      
      if (childAsParent) {
        // Créer un groupe union pour cet enfant
        const childUnionGroupId = createUnionGroup(childAsParent, groupId);
        members.push({ reference_groupe: childUnionGroupId });
      } else {
        // Pas d'enfants - mettre l'objet personne
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
      parents: parentUnionGroupId,
      type: 'fratrie',
      pere_id: parent.id_pere,
      mere_id: parent.id_mere,
      members: members
    });
    
    return groupId;
  }
  
  // Trouver les parents racines (ceux qui n'ont pas de parents eux-mêmes)
  const rootParents = parents.filter(p => {
    const pereHasParents = people.find(per => per.id === p.id_pere && per.id_parents);
    const mereHasParents = people.find(per => per.id === p.id_mere && per.id_parents);
    return !pereHasParents && !mereHasParents;
  });
  
  // Traiter chaque couple racine
  const queue = [];
  rootParents.forEach(rootParent => {
    const unionGroupId = createUnionGroup(rootParent, null);
    
    // Créer le groupe fratrie pour les enfants
    const childrenIds = people.filter(p => p.id_parents === rootParent.id).map(p => p.id);
    
    if (childrenIds.length > 0) {
      const fratrieGroupId = createChildrenFratrieGroup(childrenIds, unionGroupId, rootParent.id);
      if (fratrieGroupId) {
        queue.push({ childrenIds, fratrieGroupId });
      }
    }
  });
  
  // Traiter les descendants niveau par niveau
  while (queue.length > 0) {
    const { childrenIds } = queue.shift();
    
    childrenIds.forEach(childId => {
      // Trouver tous les couples où cet enfant est parent
      const childParents = parents.filter(p => p.id_pere === childId || p.id_mere === childId);
      
      childParents.forEach(childParent => {
        if (processedParents.has(childParent.id)) return;
        
        const childUnionGroupId = createUnionGroup(childParent, parentToGroup.get(childParent.id) || null);
        
        // Enfants de ce couple
        const grandChildrenIds = people.filter(p => p.id_parents === childParent.id).map(p => p.id);
        
        if (grandChildrenIds.length > 0) {
          const grandFratrieGroupId = createChildrenFratrieGroup(grandChildrenIds, childUnionGroupId, childParent.id);
          if (grandFratrieGroupId) {
            queue.push({ childrenIds: grandChildrenIds, fratrieGroupId: grandFratrieGroupId });
          }
        }
      });
    });
  }
  
  return groups;
}

/**
 * Afficher la structure en console
 */
function displayTreeStructureAsText(people, parents, centralPersonId) {
  console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║       STRUCTURE DE L\'ARBRE PAR GROUPES (V3)             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  const groups = buildGroupStructure(people, parents, centralPersonId);
  
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
 * Exporter la structure en JSON
 */
function exportTreeStructureAsJSON(people, parents, centralPersonId) {
  console.log('=== Export structure JSON (V3) ===');
  
  displayTreeStructureAsText(people, parents, centralPersonId);
  
  const groups = buildGroupStructure(people, parents, centralPersonId);
  
  const jsonStructure = {
    version: 3,
    totalGroupes: groups.length,
    groupes: groups
  };
  
  return jsonStructure;
}

/**
 * Dessiner une carte de personne
 */
function drawPersonCard(ctx, person, x, y, isCenter = false) {
  const width = TREE_CONFIG.nodeWidth;
  const height = TREE_CONFIG.nodeHeight;
  
  // Bordure selon sexe
  ctx.strokeStyle = person.sexe === 'M' ? TREE_CONFIG.colors.maleBorder : TREE_CONFIG.colors.femaleBorder;
  ctx.lineWidth = isCenter ? 4 : 2;
  
  // Fond
  ctx.fillStyle = TREE_CONFIG.colors.nodeBg;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);
  
  // Texte
  ctx.fillStyle = TREE_CONFIG.colors.nodeText;
  ctx.font = `bold ${TREE_CONFIG.fontSize}px ${TREE_CONFIG.fontFamily}`;
  ctx.textAlign = 'center';
  
  const centerX = x + width / 2;
  ctx.fillText(person.prenom || '', centerX, y + 30);
  ctx.font = `${TREE_CONFIG.fontSize - 1}px ${TREE_CONFIG.fontFamily}`;
  ctx.fillText(person.nom || '', centerX, y + 50);
  
  if (person.date_naissance) {
    ctx.font = `${TREE_CONFIG.fontSize - 3}px ${TREE_CONFIG.fontFamily}`;
    const naissance = person.date_naissance.substring(0, 4);
    const texte = person.vivant ? `*${naissance}` : `${naissance}`;
    ctx.fillText(texte, centerX, y + 70);
  }
}

/**
 * Calculer les générations depuis les parents
 */
function calculateGenerations(people, parents) {
  const generationMap = new Map(); // personId -> generation
  const personMap = new Map(people.map(p => [p.id, p]));
  const processed = new Set();
  
  // Fonction récursive pour définir la génération
  function setGeneration(personId, gen) {
    if (processed.has(personId)) return;
    processed.add(personId);
    
    const currentGen = generationMap.get(personId);
    if (currentGen !== undefined && currentGen < gen) {
      // Déjà défini avec une génération plus ancienne, garder celle-là
      return;
    }
    
    generationMap.set(personId, gen);
    const person = personMap.get(personId);
    if (!person) return;
    
    // Si cette personne a des parents, mettre ses parents à gen-1
    if (person.id_parents) {
      const parentCouple = parents.find(p => p.id === person.id_parents);
      if (parentCouple) {
        setGeneration(parentCouple.id_pere, gen - 1);
        setGeneration(parentCouple.id_mere, gen - 1);
        
        // Les frères et sœurs sont à la même génération
        const siblings = people.filter(p => p.id_parents === person.id_parents && p.id !== personId);
        siblings.forEach(sibling => setGeneration(sibling.id, gen));
      }
    }
    
    // Trouver les unions où cette personne est parent
    const asParent = parents.filter(p => p.id_pere === personId || p.id_mere === personId);
    asParent.forEach(couple => {
      // Le conjoint est à la même génération
      const spouseId = couple.id_pere === personId ? couple.id_mere : couple.id_pere;
      setGeneration(spouseId, gen);
      
      // Les enfants sont à gen+1
      const children = people.filter(p => p.id_parents === couple.id);
      children.forEach(child => setGeneration(child.id, gen + 1));
    });
  }
  
  // Commencer par les personnes sans parents (racines)
  const roots = people.filter(p => !p.id_parents);
  roots.forEach(root => setGeneration(root.id, 0));
  
  // Normaliser : trouver la génération minimale et décaler pour qu'elle soit à 0
  const generations = Array.from(generationMap.values());
  const minGen = Math.min(...generations);
  
  if (minGen < 0) {
    generationMap.forEach((gen, personId) => {
      generationMap.set(personId, gen - minGen);
    });
  }
  
  return generationMap;
}

/**
 * Dessiner l'arbre complet avec fratries et unions multiples intégrées
 */
function drawCompleteTreeFromPerson(personId) {
  console.log('🎨 drawCompleteTreeFromPerson v3 - Fratries + unions multiples');
  
  const canvas = document.getElementById('treeCanvas');
  if (!canvas) {
    console.error('Canvas non trouvé');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  
  fetch(`/api/tree`)
    .then(response => response.json())
    .then(data => {
      console.log('✅ Données reçues:', data);
      
      const { persons: people, parents } = data;
      const personMap = new Map(people.map(p => [p.id, p]));
      
      // Calculer les générations
      const generationMap = calculateGenerations(people, parents);
      
      // Grouper par génération
      const generations = new Map();
      generationMap.forEach((gen, personId) => {
        if (!generations.has(gen)) generations.set(gen, []);
        generations.get(gen).push(personId);
      });
      
      const genList = Array.from(generations.keys()).sort((a, b) => a - b);
      
      // Détecter les personnes avec unions multiples
      const multipleUnions = new Map();
      people.forEach(person => {
        const asParent = parents.filter(p => p.id_pere === person.id || p.id_mere === person.id);
        if (asParent.length > 1) {
          const sorted = asParent.sort((a, b) => {
            const dateA = a.date_mariage || '9999';
            const dateB = b.date_mariage || '9999';
            return dateA.localeCompare(dateB);
          });
          multipleUnions.set(person.id, sorted);
        }
      });
      
      // === ALGORITHME DE LAYOUT ===
      const positions = new Map();
      let nextX = 100;
      
      function sortByBirth(personIds) {
        return personIds
          .map(id => personMap.get(id))
          .filter(p => p !== undefined) // Filtrer les undefined
          .sort((a, b) => {
            if (a.ordre_naissance !== b.ordre_naissance) {
              return a.ordre_naissance - b.ordre_naissance;
            }
            const dateA = a.date_naissance || '9999';
            const dateB = b.date_naissance || '9999';
            return dateA.localeCompare(dateB);
          })
          .map(p => p.id); // Retourner les IDs triés
      }
      
      // Traiter chaque génération
      genList.forEach((gen, genIdx) => {
        const y = 50 + genIdx * TREE_CONFIG.generationSpacing;
        const personIds = generations.get(gen);
        const processed = new Set();
        
        // Grouper les personnes par fratrie
        const fratrieGroups = new Map(); // id_parents -> [personIds]
        const isolatedPersons = [];
        
        personIds.forEach(personId => {
          const person = personMap.get(personId);
          if (person.id_parents) {
            if (!fratrieGroups.has(person.id_parents)) {
              fratrieGroups.set(person.id_parents, []);
            }
            fratrieGroups.get(person.id_parents).push(personId);
          } else {
            isolatedPersons.push(personId);
          }
        });
        
        // === NOUVELLE STRATÉGIE : Traiter les UNIONS directement au lieu des fratries ===
        
        const processedUnions = new Set(); // Unions déjà traitées
        
        fratrieGroups.forEach((siblingIds, parentId) => {
          // Si c'est 'root' ou 0, ce sont des personnes sans parents
          if (!parentId || parentId === 'root' || parentId === 0) {
            return;
          }
          
          // Si cette union a déjà été traitée, skip
          if (processedUnions.has(parentId)) {
            console.log(`\n⏭️  Union ${parentId} déjà traitée, skip`);
            return;
          }
          processedUnions.add(parentId);
          
          const sortedSiblings = sortByBirth(siblingIds);
          
          console.log(`\n=== Fratrie (Union ID ${parentId}):`);
          console.log(`  Membres (triés): ${sortedSiblings.map(id => `${personMap.get(id)?.prenom} (ID ${id})`).join(', ')}`);
          
          // Récupérer les infos de l'union (parents)
          const parentUnion = parents.find(p => p.id === parentId);
          if (!parentUnion) {
            console.log(`  ⚠️  Union ${parentId} non trouvée dans la table parents`);
            return;
          }
          
          const pereId = parentUnion.id_pere;
          const mereId = parentUnion.id_mere;
          const pere = personMap.get(pereId);
          const mere = personMap.get(mereId);
          
          console.log(`  Parents: ${pere?.prenom} (ID ${pereId}) + ${mere?.prenom} (ID ${mereId})`);
          
          // ÉTAPE 1 : Positionner les ENFANTS de cette fratrie
          const childGen = gen + 1;
          if (genList.includes(childGen)) {
            const childY = 50 + genList.indexOf(childGen) * TREE_CONFIG.generationSpacing;
            
            // Trouver tous les enfants de cette union qui ont EUX-MÊMES des enfants
            let allChildrenByParent = []; // [{siblingId, unions: [...]}]
            
            sortedSiblings.forEach(siblingId => {
              const siblingUnions = parents.filter(p => 
                p.id_pere === siblingId || p.id_mere === siblingId
              ).sort((a, b) => {
                const dateA = a.date_mariage || '9999';
                const dateB = b.date_mariage || '9999';
                return dateA.localeCompare(dateB);
              });
              
              const unionsWithChildren = [];
              siblingUnions.forEach(union => {
                const children = sortByBirth(
                  people.filter(p => p.id_parents === union.id).map(p => p.id)
                );
                
                if (children.length > 0) {
                  // Vérifier si les enfants sont déjà positionnés (évite double traitement François/Solidea)
                  const alreadyPositioned = children.every(cid => positions.has(cid));
                  unionsWithChildren.push({
                    unionId: union.id,
                    conjointId: union.id_pere === siblingId ? union.id_mere : union.id_pere,
                    children,
                    alreadyPositioned
                  });
                }
              });
              
              if (unionsWithChildren.length > 0) {
                allChildrenByParent.push({
                  siblingId,
                  unions: unionsWithChildren
                });
              }
            });
            
            console.log(`  ${allChildrenByParent.length} membre(s) ont des enfants`);
            
            // Positionner TOUS les enfants horizontalement (sauf ceux déjà positionnés)
            let childX = nextX;
            allChildrenByParent.forEach(({ siblingId, unions }) => {
              const sibling = personMap.get(siblingId);
              console.log(`    ${sibling.prenom} a ${unions.length} union(s)`);
              
              unions.forEach((unionData, uIdx) => {
                const conjoint = personMap.get(unionData.conjointId);
                
                if (unionData.alreadyPositioned) {
                  // Enfants déjà positionnés : avancer childX sans les repositionner
                  const lastChildPos = positions.get(unionData.children[unionData.children.length - 1]);
                  if (lastChildPos) childX = lastChildPos.x + TREE_CONFIG.nodeWidth + TREE_CONFIG.siblingSpacing;
                  console.log(`      Union ${uIdx + 1} avec ${conjoint.prenom}: déjà positionnée, childX avancé à ${childX}`);
                  return;
                }
                
                console.log(`      Union ${uIdx + 1} avec ${conjoint.prenom}: ${unionData.children.map(id => personMap.get(id)?.prenom).join(', ')}`);
                
                unionData.children.forEach(childId => {
                  const child = personMap.get(childId);
                  positions.set(childId, { x: childX, y: childY });
                  processed.add(childId);
                  console.log(`        - ${child.prenom} à x=${childX}`);
                  childX += TREE_CONFIG.nodeWidth + TREE_CONFIG.siblingSpacing;
                });
              });
            });
            
            // ÉTAPE 2 : Positionner les PARENTS de cette fratrie
            console.log(`\n  Positionnement des parents (génération ${gen}):`);
            
            sortedSiblings.forEach((siblingId, siblingIdx) => {
              const sibling = personMap.get(siblingId);
              const siblingData = allChildrenByParent.find(acp => acp.siblingId === siblingId);
              
              console.log(`\n  Traitement de ${sibling.prenom} (ID ${siblingId})`);
              
              if (!siblingData || siblingData.unions.length === 0) {
                // Membre de fratrie SANS enfants (Bernard ou Thierry)
                console.log(`    ${sibling.prenom} n'a pas d'enfants`);
                
                if (siblingIdx === 0 && allChildrenByParent.length > 0) {
                  // BERNARD - Premier membre sans enfants
                  // Le positionner à GAUCHE de Jean-Pol (qui sera au-dessus de Yohan)
                  const firstMemberWithChildren = allChildrenByParent[0];
                  const firstUnion = firstMemberWithChildren.unions[0];
                  const yohanPos = positions.get(firstUnion.children[0]); // Yohan
                  
                  if (yohanPos) {
                    // Jean-Pol sera à x=yohanPos.x, donc Bernard à gauche
                    const jeanPolX = yohanPos.x;
                    const bernardX = jeanPolX - TREE_CONFIG.nodeWidth - TREE_CONFIG.siblingSpacing;
                    
                    positions.set(siblingId, { x: bernardX, y });
                    processed.add(siblingId);
                    console.log(`      → ${sibling.prenom} positionné à x=${bernardX} (gauche de Jean-Pol)`);
                  }
                } else if (siblingIdx === sortedSiblings.length - 1 && allChildrenByParent.length > 0) {
                  // THIERRY - Dernier membre sans enfants
                  // Le positionner à DROITE du bord droit de Célia
                  const lastMember = allChildrenByParent[allChildrenByParent.length - 1];
                  const lastUnion = lastMember.unions[lastMember.unions.length - 1];
                  const celiaId = lastUnion.children[lastUnion.children.length - 1]; // Célia
                  const celiaPos = positions.get(celiaId);
                  
                  if (celiaPos) {
                    // Thierry à droite du bord droit de Célia
                    const thierryX = celiaPos.x + TREE_CONFIG.nodeWidth + TREE_CONFIG.siblingSpacing;
                    positions.set(siblingId, { x: thierryX, y });
                    processed.add(siblingId);
                    console.log(`      → ${sibling.prenom} positionné à x=${thierryX} (à droite du bord droit de ${personMap.get(celiaId).prenom})`);
                  }
                }
              } else if (siblingData.unions.length === 1) {
                // UNE SEULE union - Centrer le COUPLE au-dessus des enfants
                const unionData = siblingData.unions[0];
                const conjoint = personMap.get(unionData.conjointId);
                
                console.log(`    ${sibling.prenom} a 1 union avec ${conjoint.prenom}`);
                
                const firstChildPos = positions.get(unionData.children[0]);
                const lastChildPos = positions.get(unionData.children[unionData.children.length - 1]);
                
                if (firstChildPos && lastChildPos) {
                  const childrenLeft = firstChildPos.x;
                  const childrenRight = lastChildPos.x + TREE_CONFIG.nodeWidth;
                  const childrenCenter = (childrenLeft + childrenRight) / 2;
                  
                  const pereX = childrenCenter - TREE_CONFIG.nodeWidth - TREE_CONFIG.siblingSpacing / 2;
                  const mereX = childrenCenter + TREE_CONFIG.siblingSpacing / 2;
                  
                  // Déterminer qui est le père et qui est la mère
                  const isPere = sibling.sexe === 'M';
                  const siblingX = isPere ? pereX : mereX;
                  const conjointX = isPere ? mereX : pereX;
                  
                  // FORCER le repositionnement même si déjà positionné
                  positions.set(siblingId, { x: siblingX, y });
                  processed.add(siblingId);
                  console.log(`      → ${sibling.prenom} à x=${siblingX}`);
                  
                  if (!positions.has(unionData.conjointId)) {
                    positions.set(unionData.conjointId, { x: conjointX, y });
                    processed.add(unionData.conjointId);
                    console.log(`      → ${conjoint.prenom} à x=${conjointX}`);
                  }
                }
              } else {
                // UNIONS MULTIPLES (Jean-Pol avec Michelle et Olga)
                console.log(`    ${sibling.prenom} a ${siblingData.unions.length} unions`);
                
                // Positionner chaque union
                siblingData.unions.forEach((unionData, uIdx) => {
                  const conjoint = personMap.get(unionData.conjointId);
                  
                  console.log(`      Union ${uIdx + 1} avec ${conjoint.prenom}: ${unionData.children.length} enfants`);
                  
                  const firstChildPos = positions.get(unionData.children[0]);
                  const lastChildPos = positions.get(unionData.children[unionData.children.length - 1]);
                  
                  if (firstChildPos && lastChildPos) {
                    const childrenLeft = firstChildPos.x;
                    const childrenRight = lastChildPos.x + TREE_CONFIG.nodeWidth;
                    const childrenCenter = (childrenLeft + childrenRight) / 2;
                    
                    if (uIdx === 0) {
                      // Première union : Jean-Pol AU-DESSUS du premier enfant (Yohan)
                      const jeanPolX = firstChildPos.x;
                      const michelleX = jeanPolX + TREE_CONFIG.nodeWidth + TREE_CONFIG.siblingSpacing;
                      
                      // FORCER le repositionnement de Jean-Pol même s'il a déjà une position
                      positions.set(siblingId, { x: jeanPolX, y });
                      processed.add(siblingId);
                      console.log(`        → ${sibling.prenom} à x=${jeanPolX} (AU-DESSUS de ${personMap.get(unionData.children[0]).prenom})`);
                      
                      if (!positions.has(unionData.conjointId)) {
                        positions.set(unionData.conjointId, { x: michelleX, y });
                        processed.add(unionData.conjointId);
                        console.log(`        → ${conjoint.prenom} à x=${michelleX}`);
                      }
                    } else {
                      // Unions suivantes : Olga centrée AU-DESSUS de ses enfants (François-Célia)
                      if (!positions.has(unionData.conjointId)) {
                        const olgaX = childrenCenter - TREE_CONFIG.nodeWidth / 2;
                        positions.set(unionData.conjointId, { x: olgaX, y });
                        processed.add(unionData.conjointId);
                        console.log(`        → ${conjoint.prenom} à x=${olgaX} (centrée sur ses enfants)`);
                      }
                    }
                  }
                });
              }
            });
            
            // Positionner les PARENTS de la fratrie (François + Solidea) au-dessus
            if (!positions.has(pereId)) {
              const fratrieFirstChild = positions.get(sortedSiblings[0]);
              const fratrieLastChild = positions.get(sortedSiblings[sortedSiblings.length - 1]);
              
              if (fratrieFirstChild && fratrieLastChild) {
                const fratrieCenter = (fratrieFirstChild.x + fratrieLastChild.x + TREE_CONFIG.nodeWidth) / 2;
                const pereX = fratrieCenter - TREE_CONFIG.nodeWidth - TREE_CONFIG.siblingSpacing / 2;
                const mereX = fratrieCenter + TREE_CONFIG.siblingSpacing / 2;
                
                positions.set(pereId, { x: pereX, y });
                processed.add(pereId);
                console.log(`\n  → ${pere.prenom} (père de la fratrie) à x=${pereX}`);
                
                positions.set(mereId, { x: mereX, y });
                processed.add(mereId);
                console.log(`  → ${mere.prenom} (mère de la fratrie) à x=${mereX}`);
              }
            }
            
            nextX = childX + TREE_CONFIG.horizontalSpacing;
            
          } else {
            // Pas d'enfants - positionner juste la fratrie + ses parents
            let fratrieX = nextX;
            sortedSiblings.forEach(siblingId => {
              positions.set(siblingId, { x: fratrieX, y });
              processed.add(siblingId);
              fratrieX += TREE_CONFIG.nodeWidth + TREE_CONFIG.siblingSpacing;
            });
            
            // Positionner les parents au-dessus
            if (!positions.has(pereId) && !positions.has(mereId)) {
              const fratrieCenter = nextX + (fratrieX - nextX) / 2;
              const pereX = fratrieCenter - TREE_CONFIG.nodeWidth - TREE_CONFIG.siblingSpacing / 2;
              const mereX = fratrieCenter + TREE_CONFIG.siblingSpacing / 2;
              
              positions.set(pereId, { x: pereX, y });
              positions.set(mereId, { x: mereX, y });
              processed.add(pereId);
              processed.add(mereId);
            }
            
            nextX = fratrieX + TREE_CONFIG.horizontalSpacing;
          }
        });
        
        console.log(`\n=== RÉSUMÉ positions génération ${gen}:`);
        Array.from(positions.entries())
          .filter(([id, pos]) => personMap.get(id) && pos.y === y)
          .sort((a, b) => a[1].x - b[1].x)
          .forEach(([id, pos]) => {
            const person = personMap.get(id);
            console.log(`  ${person.prenom} (ID ${id}): x=${pos.x}, y=${pos.y}`);
          });
        
        // Traiter les couples isolés (personnes sans parents elles-mêmes)
        const couplesProcessed = new Set();
        
        isolatedPersons.forEach(personId => {
          if (processed.has(personId)) return;
          
          // Vérifier si cette personne fait partie d'un couple
          const asParent = parents.find(p => 
            (p.id_pere === personId || p.id_mere === personId) &&
            generationMap.get(p.id_pere) === gen &&
            generationMap.get(p.id_mere) === gen
          );
          
          if (asParent) {
            const coupleKey = [asParent.id_pere, asParent.id_mere].sort().join('_');
            if (couplesProcessed.has(coupleKey)) return;
            couplesProcessed.add(coupleKey);
            
            // Positionner le couple et leurs enfants
            const pereId = asParent.id_pere;
            const mereId = asParent.id_mere;
            const children = sortByBirth(people.filter(p => p.id_parents === asParent.id).map(p => p.id));
            
            if (children.length > 0) {
              const childGen = gen + 1;
              const childY = 50 + genList.indexOf(childGen) * TREE_CONFIG.generationSpacing;
              const childrenWidth = children.length * (TREE_CONFIG.nodeWidth + TREE_CONFIG.siblingSpacing);
              
              // Centrer les parents au-dessus des enfants
              const parentsWidth = 2 * TREE_CONFIG.nodeWidth + TREE_CONFIG.siblingSpacing;
              const centerX = nextX + (childrenWidth - parentsWidth) / 2;
              
              positions.set(pereId, { x: centerX, y });
              positions.set(mereId, { x: centerX + TREE_CONFIG.nodeWidth + TREE_CONFIG.siblingSpacing, y });
              processed.add(pereId);
              processed.add(mereId);
              
              // Positionner les enfants
              let childX = nextX;
              children.forEach(child => {
                positions.set(child.id, { x: childX, y: childY });
                processed.add(child.id);
                childX += TREE_CONFIG.nodeWidth + TREE_CONFIG.siblingSpacing;
              });
              
              nextX = Math.max(nextX + childrenWidth, centerX + parentsWidth) + TREE_CONFIG.horizontalSpacing;
            } else {
              // Couple sans enfants
              positions.set(pereId, { x: nextX, y });
              positions.set(mereId, { x: nextX + TREE_CONFIG.nodeWidth + TREE_CONFIG.siblingSpacing, y });
              processed.add(pereId);
              processed.add(mereId);
              nextX += 2 * TREE_CONFIG.nodeWidth + 2 * TREE_CONFIG.siblingSpacing;
            }
          } else {
            // Personne isolée
            positions.set(personId, { x: nextX, y });
            processed.add(personId);
            nextX += TREE_CONFIG.nodeWidth + TREE_CONFIG.horizontalSpacing;
          }
        });
        
        nextX = 100; // Reset pour la prochaine génération
      });
      
      // Calculer la taille du canvas
      const allPositions = Array.from(positions.values());
      const minX = Math.min(...allPositions.map(p => p.x));
      const maxX = Math.max(...allPositions.map(p => p.x + TREE_CONFIG.nodeWidth));
      const maxY = Math.max(...allPositions.map(p => p.y + TREE_CONFIG.nodeHeight));
      
      // Si minX est négatif, décaler toutes les positions
      if (minX < 50) {
        const offset = 100 - minX;
        positions.forEach((pos, id) => {
          positions.set(id, { x: pos.x + offset, y: pos.y });
        });
      }
      
      const finalMaxX = Math.max(...Array.from(positions.values()).map(p => p.x + TREE_CONFIG.nodeWidth));
      
      canvas.width = Math.max(2500, finalMaxX + 200);
      canvas.height = Math.max(1000, maxY + 150);
      
      // Fond
      ctx.fillStyle = '#f9f9f9';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Dessiner toutes les personnes
      positions.forEach((pos, personId) => {
        const person = personMap.get(personId);
        if (person) {
          drawPersonCard(ctx, person, pos.x, pos.y, personId === parseInt(personId));
        }
      });
      
      // Dessiner les liens parents-enfants
      ctx.strokeStyle = TREE_CONFIG.colors.linkColor;
      ctx.lineWidth = 2;
      
      parents.forEach(parentCouple => {
        const perePos = positions.get(parentCouple.id_pere);
        const merePos = positions.get(parentCouple.id_mere);
        
        if (!perePos || !merePos) return;
        
        const pereX = perePos.x + TREE_CONFIG.nodeWidth / 2;
        const mereX = merePos.x + TREE_CONFIG.nodeWidth / 2;
        const parentY = Math.max(perePos.y, merePos.y) + TREE_CONFIG.nodeHeight;
        
        // Ligne en U entre conjoints
        ctx.beginPath();
        ctx.moveTo(pereX, perePos.y + TREE_CONFIG.nodeHeight);
        ctx.lineTo(pereX, parentY + 20);
        ctx.lineTo(mereX, parentY + 20);
        ctx.lineTo(mereX, merePos.y + TREE_CONFIG.nodeHeight);
        ctx.stroke();
        
        const midX = (pereX + mereX) / 2;
        const childY = parentY + 20;
        
        // Lignes vers enfants
        const children = people.filter(p => p.id_parents === parentCouple.id);
        if (children.length > 0) {
          ctx.beginPath();
          ctx.moveTo(midX, childY);
          ctx.lineTo(midX, childY + 30);
          ctx.stroke();
          
          if (children.length > 1) {
            const childPositions = children.map(c => positions.get(c.id)).filter(p => p);
            if (childPositions.length > 0) {
              const leftMost = Math.min(...childPositions.map(p => p.x + TREE_CONFIG.nodeWidth / 2));
              const rightMost = Math.max(...childPositions.map(p => p.x + TREE_CONFIG.nodeWidth / 2));
              
              ctx.beginPath();
              ctx.moveTo(leftMost, childY + 30);
              ctx.lineTo(rightMost, childY + 30);
              ctx.stroke();
            }
          }
          
          children.forEach(child => {
            const childPos = positions.get(child.id);
            if (childPos) {
              const childX = childPos.x + TREE_CONFIG.nodeWidth / 2;
              ctx.beginPath();
              ctx.moveTo(childX, childY + 30);
              ctx.lineTo(childX, childPos.y);
              ctx.stroke();
            }
          });
        }
      });
      
      console.log('✅ Arbre dessiné avec fratries intégrées');
    })
    .catch(error => {
      console.error('❌ Erreur lors du chargement des données:', error);
    });
}

/**
 * Export pour app.js
 */
if (typeof window !== 'undefined') {
  window.drawCompleteTreeFromPerson = drawCompleteTreeFromPerson;
  window.exportTreeStructureAsJSON = exportTreeStructureAsJSON;
}
