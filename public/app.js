// app.js - NeoGenea Frontend - Version améliorée

const API_URL = '/api';
let allPersons = [];
let currentPersonId = null;
let editMode = false; // Mode édition par défaut: verrouillé
let currentViewMode = 'cards'; // cards ou table
let currentSortOrder = 'recent'; // recent (plus jeunes en premier) ou old (plus âgés en premier)
let treeZoomLevel = 1.0;
let currentPhotoFile = null; // Fichier photo en attente d'upload
let currentPhotoUrl = null; // URL de la photo existante
let treeData = { generations: null, relations: null }; // Données de l'arbre pour redessiner les connexions
let addRelativeContext = null; // Contexte pour ajout rapide depuis l'arbre (ex: {personId: 123, relationType: 'child'})

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initForms();
  initEditMode();
  initViewModeSwitcher();
  initSortOrderSwitcher();
  initBurgerMenu();
  // initTreeZoom(); // Désactivé pour Canvas
  initPhotoUpload();
  loadPersons();
  loadStats();
});

// Navigation entre les vues
function initNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      showView(view);
      
      // Mettre à jour les boutons actifs
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Fermer le menu mobile si ouvert
      closeMobileMenu();
    });
  });
}

function showView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');
  
  // Actions spécifiques selon la vue
  if (viewName === 'tree') {
    populateTreePersonSelect();
    generateCompleteTree();
  }
  if (viewName === 'add') {
    resetForm();
  }
}

// Mode édition - Toggle switch
function initEditMode() {
  const toggle = document.getElementById('edit-mode-toggle');
  const label = document.getElementById('edit-mode-label');
  
  toggle.addEventListener('change', () => {
    editMode = toggle.checked;
    label.textContent = editMode ? '🔓 Édition activée' : '🔒 Verrouillé';
    updateEditModeUI();
  });
  
  // Initialiser au démarrage (verrouillé)
  updateEditModeUI();
}

function updateEditModeUI() {
  const editActions = document.querySelectorAll('.edit-action');
  editActions.forEach(el => {
    el.disabled = !editMode;
    el.style.opacity = editMode ? '1' : '0.5';
  });
}

function checkEditMode() {
  if (!editMode) {
    showLockedMessage();
    return false;
  }
  return true;
}

function showLockedMessage() {
  // Créer et afficher le message temporaire
  const msg = document.createElement('div');
  msg.className = 'locked-message';
  msg.textContent = '🔒 Veuillez activer le mode édition pour modifier les données';
  document.body.appendChild(msg);
  
  setTimeout(() => {
    msg.remove();
  }, 3000);
}

/**
 * Afficher le menu contextuel pour ajouter un proche
 * @param {number} personId - ID de la personne de référence
 * @param {string} personName - Nom de la personne
 * @param {number} x - Position X du clic
 * @param {number} y - Position Y du clic
 */
function showAddRelativeMenu(personId, personName, x, y) {
  if (!checkEditMode()) return;
  
  // Supprimer le menu existant s'il y en a un
  const existingMenu = document.getElementById('add-relative-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  // Créer le menu
  const menu = document.createElement('div');
  menu.id = 'add-relative-menu';
  menu.className = 'context-menu';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  
  // Options du menu
  const options = [
    { type: 'parent', label: '👨‍👩 Ajouter un parent', icon: '👆' },
    { type: 'child', label: '👶 Ajouter un enfant', icon: '👇' },
    { type: 'sibling', label: '👫 Ajouter un frère/sœur', icon: '↔️' },
    { type: 'spouse', label: '💑 Ajouter un(e) conjoint(e)', icon: '💍' }
  ];
  
  menu.innerHTML = `
    <div class="context-menu-header">Ajouter un proche de <strong>${personName}</strong></div>
    ${options.map(opt => `
      <div class="context-menu-item" data-type="${opt.type}" data-person-id="${personId}">
        <span class="context-menu-icon">${opt.icon}</span>
        <span class="context-menu-label">${opt.label}</span>
      </div>
    `).join('')}
  `;
  
  document.body.appendChild(menu);
  
  // Gérer les clics sur les options
  menu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const type = item.dataset.type;
      const pId = parseInt(item.dataset.personId);
      handleAddRelative(pId, type);
      menu.remove();
    });
  });
  
  // Fermer le menu si on clique ailleurs
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);
}

/**
 * Gérer l'ajout rapide d'un proche depuis l'arbre
 * @param {number} personId - ID de la personne de référence
 * @param {string} relationType - Type: 'parent', 'child', 'sibling', 'spouse'
 */
function handleAddRelative(personId, relationType) {
  if (!checkEditMode()) return;
  
  console.log('Ajout rapide:', relationType, 'pour personne', personId);
  
  // Stocker le contexte pour créer la relation après l'ajout de la personne
  addRelativeContext = {
    personId: personId,
    relationType: relationType
  };
  
  // Basculer vers la vue d'ajout
  showView('add');
  
  // Mettre à jour le titre du formulaire
  const formTitle = document.getElementById('form-title');
  const relationLabels = {
    parent: 'Ajouter un parent',
    child: 'Ajouter un enfant',
    sibling: 'Ajouter un frère/sœur',
    spouse: 'Ajouter un(e) conjoint(e)'
  };
  formTitle.textContent = relationLabels[relationType] || 'Ajouter une personne';
  
  // Message d'information
  const form = document.getElementById('person-form');
  let infoMsg = form.querySelector('.add-relative-info');
  if (!infoMsg) {
    infoMsg = document.createElement('div');
    infoMsg.className = 'add-relative-info';
    infoMsg.style.cssText = 'padding: 12px; background: #e3f2fd; border-left: 4px solid #2196F3; margin-bottom: 20px; border-radius: 4px;';
    form.insertBefore(infoMsg, form.firstChild);
  }
  
  const person = allPersons.find(p => p.id == personId);
  const personName = person ? `${person.prenom || ''} ${person.nom || ''}`.trim() : 'cette personne';
  
  infoMsg.innerHTML = `ℹ️ Une relation sera automatiquement créée avec <strong>${personName}</strong> après l'enregistrement.`;
}

// Switch vue cartes/tableau
function initViewModeSwitcher() {
  document.querySelectorAll('.view-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentViewMode = btn.dataset.mode;
      
      // Mettre à jour les boutons actifs
      document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Réafficher la liste avec le nouveau mode
      displayPersons(allPersons);
    });
  });
}

// Switch ordre de tri
function initSortOrderSwitcher() {
  const select = document.getElementById('sort-order');
  if (select) {
    select.addEventListener('change', (e) => {
      currentSortOrder = e.target.value;
      loadPersons();
    });
  }
}

// Menu burger pour mobile
function initBurgerMenu() {
  const burger = document.getElementById('burger-menu');
  const overlay = document.getElementById('overlay');
  const closeBtn = document.getElementById('close-menu');
  
  if (burger) {
    burger.addEventListener('click', () => {
      document.querySelector('.sidebar').classList.add('active');
      overlay.classList.add('active');
    });
  }
  
  if (overlay) {
    overlay.addEventListener('click', closeMobileMenu);
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMobileMenu);
  }
}

function closeMobileMenu() {
  document.querySelector('.sidebar').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
}

// Contrôles zoom arbre (Désactivé pour Canvas - utiliser zoom navigateur)
/*
function initTreeZoom() {
  // Zoom géré différemment avec Canvas
}

function applyTreeZoom() {
  // Zoom géré différemment avec Canvas
}
*/

// Gestion de l'upload de photo
function initPhotoUpload() {
  const photoInput = document.getElementById('photo-upload');
  const photoPreview = document.getElementById('photo-preview');
  const removeBtn = document.getElementById('remove-photo-btn');
  
  if (photoInput) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // Vérification du type
        if (!file.type.startsWith('image/')) {
          alert('Veuillez sélectionner une image');
          return;
        }
        
        // Vérification de la taille (5Mo max)
        if (file.size > 5 * 1024 * 1024) {
          alert('La photo ne doit pas dépasser 5 Mo');
          return;
        }
        
        currentPhotoFile = file;
        
        // Afficher la prévisualisation
        const reader = new FileReader();
        reader.onload = (e) => {
          photoPreview.innerHTML = `<img src="${e.target.result}" alt="Prévisualisation">`;
          removeBtn.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

function removePhoto() {
  currentPhotoFile = null;
  currentPhotoUrl = null;
  document.getElementById('photo-upload').value = '';
  document.getElementById('photo-preview').innerHTML = '<span class="photo-placeholder">📷</span>';
  document.getElementById('remove-photo-btn').style.display = 'none';
}

function displayCurrentPhoto(photoUrl) {
  if (photoUrl) {
    currentPhotoUrl = photoUrl;
    const photoPreview = document.getElementById('photo-preview');
    photoPreview.innerHTML = `<img src="${photoUrl}" alt="Photo actuelle">`;
    document.getElementById('remove-photo-btn').style.display = 'inline-block';
  }
}

// Chargement des statistiques
async function loadStats() {
  try {
    const response = await fetch(`${API_URL}/tree/stats/all`);
    const stats = await response.json();
    
    document.getElementById('stat-persons').textContent = 
      `${stats.total_persons || 0} personne${stats.total_persons > 1 ? 's' : ''}`;
    document.getElementById('stat-relations').textContent = 
      `${stats.total_relations || 0} relation${stats.total_relations > 1 ? 's' : ''}`;
    document.getElementById('stat-medias').textContent = 
      `${stats.total_medias || 0} média${stats.total_medias > 1 ? 's' : ''}`;
  } catch (error) {
    console.error('Erreur chargement stats:', error);
  }
}

// Chargement de toutes les personnes avec tri
async function loadPersons() {
  try {
    const response = await fetch(`${API_URL}/persons`);
    allPersons = await response.json();
    
    // Tri par date de naissance
    sortPersons();
    
    displayPersons(allPersons);
  } catch (error) {
    console.error('Erreur chargement personnes:', error);
    document.getElementById('persons-list').innerHTML = 
      '<p class="error">Erreur de chargement</p>';
  }
}

function sortPersons() {
  allPersons.sort((a, b) => {
    const dateA = a.date_naissance ? new Date(a.date_naissance) : new Date('1900-01-01');
    const dateB = b.date_naissance ? new Date(b.date_naissance) : new Date('1900-01-01');
    
    if (currentSortOrder === 'recent') {
      return dateB - dateA; // Plus récents d'abord (plus jeunes)
    } else {
      return dateA - dateB; // Plus anciens d'abord (plus âgés)
    }
  });
}

// Affichage de la liste des personnes (cartes ou tableau)
function displayPersons(persons) {
  const container = document.getElementById('persons-list');
  
  if (persons.length === 0) {
    container.innerHTML = '<p class="info">Aucune personne enregistrée</p>';
    return;
  }
  
  if (currentViewMode === 'table') {
    displayPersonsTable(persons, container);
  } else {
    displayPersonsCards(persons, container);
  }
  
  // Mettre à jour les boutons edit-action après affichage
  setTimeout(updateEditModeUI, 100);
}

// Affichage en grille de cartes
function displayPersonsCards(persons, container) {
  container.innerHTML = `<div class="persons-grid">${persons.map(person => `
    <div class="person-card" onclick="showPersonDetail(${person.id})">
      ${person.photo ? 
        `<img src="${person.photo}" alt="${person.prenom} ${person.nom}" class="photo">` :
        '<div class="photo" style="background: #ddd; display: flex; align-items: center; justify-content: center; font-size: 2em;">👤</div>'
      }
      <div class="name">${person.prenom || ''} ${person.nom}</div>
      <div class="info">
        ${person.sexe === 'M' ? '♂' : person.sexe === 'F' ? '♀' : '⚲'} 
        ${getStatusText(person)}
      </div>
      ${person.date_naissance ? `
        <div class="dates">
          Né(e) le ${formatDate(person.date_naissance)}
        </div>
      ` : ''}
    </div>
  `).join('')}</div>`;
}

// Affichage en tableau type Excel
function displayPersonsTable(persons, container) {
  container.innerHTML = `
    <div class="persons-table-container">
      <table class="persons-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Prénom</th>
            <th>Nom</th>
            <th>Sexe</th>
            <th>Date naissance</th>
            <th>Date décès</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${persons.map(person => `
            <tr>
              <td>
                ${person.photo ? 
                  `<img src="${person.photo}" alt="${person.prenom} ${person.nom}" class="photo-cell">` :
                  '<span style="font-size: 2em;">👤</span>'
                }
              </td>
              <td>${person.prenom || '-'}</td>
              <td>${person.nom || '-'}</td>
              <td>${person.sexe === 'M' ? '♂' : person.sexe === 'F' ? '♀' : '⚲'}</td>
              <td>${person.date_naissance ? formatDate(person.date_naissance) : '-'}</td>
              <td>${person.date_deces ? formatDate(person.date_deces) : '-'}</td>
              <td>${getStatusTextWithIcon(person)}</td>
              <td>
                <button class="btn btn-primary btn-small action-btn edit-action" onclick="event.stopPropagation(); editPerson(${person.id})">✏️</button>
                <button class="btn btn-secondary btn-small action-btn" onclick="event.stopPropagation(); showPersonDetail(${person.id})">👁️</button>
                <button class="btn btn-danger btn-small action-btn edit-action" onclick="event.stopPropagation(); deletePerson(${person.id})">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Affichage du détail d'une personne
async function showPersonDetail(personId) {
  showView('detail');
  currentPersonId = personId;
  
  const container = document.getElementById('person-detail');
  container.innerHTML = '<p class="loading">Chargement...</p>';
  
  try {
    const response = await fetch(`${API_URL}/persons/${personId}`);
    const person = await response.json();
    
    container.innerHTML = `
      <div class="detail-container">
        <div class="person-detail-header">
          ${person.photo_principale ? 
            `<img src="${person.photo_principale}" alt="${person.prenom} ${person.nom}" class="person-detail-photo">` :
            '<div class="person-detail-photo" style="background: #ddd; display: flex; align-items: center; justify-content: center; font-size: 4em;">👤</div>'
          }
          <div class="person-detail-info">
            <h2>${person.prenom || ''} ${person.nom}</h2>
            ${person.nom_jeune_fille ? `<div class="info-item"><span class="info-label">Nom de jeune fille:</span>${person.nom_jeune_fille}</div>` : ''}
            <div class="info-item"><span class="info-label">Sexe:</span>${person.sexe === 'M' ? 'Masculin' : person.sexe === 'F' ? 'Féminin' : 'Autre'}</div>
            ${person.date_naissance ? `<div class="info-item"><span class="info-label">Naissance:</span>${formatDate(person.date_naissance)}${person.lieu_naissance ? ' à ' + person.lieu_naissance : ''}</div>` : ''}
            ${person.date_deces ? `<div class="info-item"><span class="info-label">Décès:</span>${formatDate(person.date_deces)}${person.lieu_deces ? ' à ' + person.lieu_deces : ''}</div>` : ''}
            <div class="info-item"><span class="info-label">Statut:</span>${getStatusTextWithIcon(person)}</div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
              <button class="btn btn-primary btn-small edit-action" onclick="editPerson(${person.id})">✏️ Modifier</button>
              <button class="btn btn-secondary btn-small edit-action" onclick="openRelationModal(${person.id})">🔗 Ajouter relation</button>
              <button class="btn btn-danger btn-small edit-action" onclick="deletePerson(${person.id})">🗑️ Supprimer</button>
            </div>
          </div>
        </div>
        
        ${person.biographie ? `
          <div class="section">
            <h3>📝 Biographie</h3>
            <p>${person.biographie}</p>
          </div>
        ` : ''}
        
        <div class="section">
          <h3>👨‍👩‍👧‍👦 Relations</h3>
          ${displayRelations(person.relations)}
        </div>
        
        ${person.medias && person.medias.length > 0 ? `
          <div class="section">
            <h3>📸 Médias (${person.medias.length})</h3>
            <div class="medias-grid">
              ${person.medias.map(m => `
                <div class="media-item">
                  ${m.type_media === 'photo' ? `<img src="${m.chemin_fichier}" alt="${m.description || ''}" style="max-width: 150px; border-radius: 8px;">` : `<p>📄 ${m.description || 'Document'}</p>`}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    // Mettre à jour les boutons edit-action
    setTimeout(updateEditModeUI, 100);
  } catch (error) {
    console.error('Erreur chargement personne:', error);
    container.innerHTML = '<p class="error">Erreur de chargement</p>';
  }
}

// Affichage des relations
function displayRelations(relations) {
  if (!relations || relations.length === 0) {
    return '<p class="info">Aucune relation enregistrée</p>';
  }
  
  return `<div class="relations-list">${relations.map(rel => `
    <div class="relation-item">
      <div>
        <span class="type">${getRelationLabel(rel.type_relation)}</span>
        <span>${rel.person2_prenom} ${rel.person2_nom}</span>
      </div>
      <button class="btn btn-danger btn-small edit-action" onclick="deleteRelation(${rel.id})">🗑️</button>
    </div>
  `).join('')}</div>`;
}

function getRelationLabel(type) {
  const labels = {
    'parent': '👨 Parent',
    'enfant': '👶 Enfant',
    'conjoint': '💑 Conjoint',
    'frere': '👨‍👦 Frère',
    'soeur': '👩‍👧 Sœur'
  };
  return labels[type] || type;
}

// Gestion du formulaire de personne
function initForms() {
  document.getElementById('person-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!checkEditMode()) return;
    await savePerson();
  });
  
  document.getElementById('relation-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!checkEditMode()) return;
    await saveRelation();
  });
  
  document.getElementById('search-input').addEventListener('input', (e) => {
    if (e.target.value.length >= 2) {
      searchPersons();
    } else {
      document.getElementById('search-results').innerHTML = '';
    }
  });
}

async function savePerson() {
  const formData = new FormData(document.getElementById('person-form'));
  const data = {
    nom: formData.get('nom'),
    prenom: formData.get('prenom'),
    nom_jeune_fille: formData.get('nom_jeune_fille'),
    sexe: formData.get('sexe'),
    date_naissance: formData.get('date_naissance') || null,
    lieu_naissance: formData.get('lieu_naissance'),
    date_deces: formData.get('date_deces') || null,
    lieu_deces: formData.get('lieu_deces'),
    biographie: formData.get('biographie'),
    vivant: document.getElementById('vivant').checked
  };
  
  const personId = document.getElementById('person-id').value;
  
  try {
    // Sauvegarder la personne
    const response = await fetch(
      `${API_URL}/persons${personId ? '/' + personId : ''}`,
      {
        method: personId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    );
    
    if (response.ok) {
      const savedPerson = await response.json();
      const actualPersonId = savedPerson.id || personId;
      
      // Si une photo a été sélectionnée, l'uploader
      if (currentPhotoFile) {
        await uploadPhoto(actualPersonId, currentPhotoFile);
      }
      
      // Si on est dans un contexte d'ajout rapide depuis l'arbre, créer la relation
      if (addRelativeContext && !personId) {  // Seulement pour les nouvelles personnes
        await createRelationFromContext(actualPersonId, addRelativeContext);
      }
      
      alert(personId ? 'Personne modifiée avec succès' : 'Personne créée avec succès');
      resetForm();
      
      // Si on était dans un contexte d'ajout depuis l'arbre, retourner à la vue arbre
      if (addRelativeContext) {
        addRelativeContext = null;
        showView('tree');
        generateCompleteTree(); // Recharger l'arbre
      } else {
        showView('list');
      }
      
      loadPersons();
      loadStats();
    } else {
      const error = await response.json();
      alert('Erreur: ' + error.error);
    }
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    alert('Erreur lors de la sauvegarde');
  }
}

async function uploadPhoto(personId, photoFile) {
  try {
    const formData = new FormData();
    formData.append('file', photoFile);
    formData.append('person_id', personId);
    formData.append('type_media', 'photo');
    formData.append('description', 'Photo de profil');
    formData.append('principale', 'true');
    
    const response = await fetch(`${API_URL}/medias/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      console.error('Erreur upload photo');
    }
  } catch (error) {
    console.error('Erreur upload photo:', error);
  }
}

/**
 * Créer automatiquement une relation après ajout d'un proche
 * @param {number} newPersonId - ID de la personne nouvellement créée
 * @param {object} context - {personId, relationType}
 */
async function createRelationFromContext(newPersonId, context) {
  const { personId, relationType } = context;
  
  try {
    console.log('Création relation:', relationType, 'entre', personId, 'et', newPersonId);
    
    // Selon le type, créer la relation appropriée
    let person1_id, person2_id, type_relation;
    
    switch (relationType) {
      case 'parent':
        // La personne existante est l'enfant, la nouvelle personne est le parent
        person1_id = newPersonId;
        person2_id = personId;
        type_relation = 'parent';
        break;
        
      case 'child':
        // La personne existante est le parent, la nouvelle personne est l'enfant
        // Pour les enfants, il faudrait idéalement créer une union, mais pour simplifier on crée une relation parent
        person1_id = personId;
        person2_id = newPersonId;
        type_relation = 'parent';
        break;
        
      case 'sibling':
        // Frère ou sœur - relation bidirectionnelle
        person1_id = personId;
        person2_id = newPersonId;
        type_relation = 'frere'; // On utilise "frere" pour tous les siblings
        break;
        
      case 'spouse':
        // Conjoint - créer une union
        person1_id = personId;
        person2_id = newPersonId;
        
        // Créer une union plutôt qu'une relation simple
        const unionResponse = await fetch(`${API_URL}/unions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            person1_id: person1_id,
            person2_id: person2_id,
            type_union: 'mariage'
          })
        });
        
        if (!unionResponse.ok) {
          console.error('Erreur création union');
        }
        return; // Sortir, pas besoin de créer une relation
    }
    
    // Créer la relation
    const response = await fetch(`${API_URL}/relations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        person1_id: person1_id,
        person2_id: person2_id,
        type_relation: type_relation
      })
    });
    
    if (!response.ok) {
      console.error('Erreur création relation');
    }
  } catch (error) {
    console.error('Erreur création relation automatique:', error);
  }
}

async function editPerson(personId) {
  if (!checkEditMode()) return;
  
  try {
    const response = await fetch(`${API_URL}/persons/${personId}`);
    const person = await response.json();
    
    document.getElementById('form-title').textContent = 'Modifier une personne';
    document.getElementById('person-id').value = person.id;
    document.getElementById('nom').value = person.nom || '';
    document.getElementById('prenom').value = person.prenom || '';
    document.getElementById('nom_jeune_fille').value = person.nom_jeune_fille || '';
    document.getElementById('sexe').value = person.sexe || '';
    document.getElementById('date_naissance').value = person.date_naissance || '';
    document.getElementById('lieu_naissance').value = person.lieu_naissance || '';
    document.getElementById('date_deces').value = person.date_deces || '';
    document.getElementById('lieu_deces').value = person.lieu_deces || '';
    document.getElementById('biographie').value = person.biographie || '';
    document.getElementById('vivant').checked = person.vivant;
    
    // Afficher la photo existante
    if (person.photo_principale) {
      displayCurrentPhoto(person.photo_principale);
    } else {
      removePhoto();
    }
    
    showView('add');
  } catch (error) {
    console.error('Erreur chargement personne:', error);
    alert('Erreur lors du chargement');
  }
}

async function deletePerson(personId) {
  if (!checkEditMode()) return;
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette personne ?')) return;
  
  try {
    const response = await fetch(`${API_URL}/persons/${personId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('Personne supprimée avec succès');
      showView('list');
      loadPersons();
      loadStats();
    } else {
      const error = await response.json();
      alert('Erreur: ' + error.error);
    }
  } catch (error) {
    console.error('Erreur suppression:', error);
    alert('Erreur lors de la suppression');
  }
}

function resetForm() {
  document.getElementById('person-form').reset();
  document.getElementById('person-id').value = '';
  document.getElementById('form-title').textContent = 'Ajouter une personne';
  document.getElementById('vivant').checked = true;
  removePhoto(); // Réinitialiser la photo
  
  // Nettoyer le contexte d'ajout rapide
  addRelativeContext = null;
  
  // Supprimer le message d'information si présent
  const form = document.getElementById('person-form');
  const infoMsg = form.querySelector('.add-relative-info');
  if (infoMsg) {
    infoMsg.remove();
  }
}

// Gestion des relations
function openRelationModal(personId) {
  if (!checkEditMode()) return;
  
  currentPersonId = personId;
  document.getElementById('relation-person1').value = personId;
  
  // Remplir la liste des personnes
  const select = document.getElementById('relation-person2');
  select.innerHTML = '<option value="">Sélectionner une personne</option>' +
    allPersons
      .filter(p => p.id !== personId)
      .map(p => `<option value="${p.id}">${p.prenom} ${p.nom}</option>`)
      .join('');
  
  document.getElementById('relation-modal').classList.add('active');
}

function closeRelationModal() {
  document.getElementById('relation-modal').classList.remove('active');
  document.getElementById('relation-form').reset();
}

async function saveRelation() {
  const formData = new FormData(document.getElementById('relation-form'));
  const data = {
    person1_id: parseInt(formData.get('person1_id')),
    person2_id: parseInt(formData.get('person2_id')),
    type_relation: formData.get('type_relation'),
    date_debut: formData.get('date_debut') || null,
    date_fin: formData.get('date_fin') || null
  };
  
  try {
    const response = await fetch(`${API_URL}/relations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      alert('Relation créée avec succès');
      closeRelationModal();
      loadStats();
      if (currentPersonId) {
        showPersonDetail(currentPersonId);
      }
    } else {
      const error = await response.json();
      alert('Erreur: ' + error.error);
    }
  } catch (error) {
    console.error('Erreur création relation:', error);
    alert('Erreur lors de la création de la relation');
  }
}

async function deleteRelation(relationId) {
  if (!checkEditMode()) return;
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette relation ?')) return;
  
  try {
    const response = await fetch(`${API_URL}/relations/${relationId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('Relation supprimée avec succès');
      loadStats();
      if (currentPersonId) {
        showPersonDetail(currentPersonId);
      }
    } else {
      const error = await response.json();
      alert('Erreur: ' + error.error);
    }
  } catch (error) {
    console.error('Erreur suppression relation:', error);
    alert('Erreur lors de la suppression');
  }
}

// Recherche
async function searchPersons() {
  const query = document.getElementById('search-input').value;
  const container = document.getElementById('search-results');
  
  if (query.length < 2) {
    container.innerHTML = '<p class="info">Entrez au moins 2 caractères pour rechercher</p>';
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/persons/search?q=${encodeURIComponent(query)}`);
    const results = await response.json();
    
    if (results.length === 0) {
      container.innerHTML = '<p class="info">Aucun résultat</p>';
    } else {
      displayPersonsInContainer(results, container);
    }
  } catch (error) {
    console.error('Erreur recherche:', error);
    container.innerHTML = '<p class="error">Erreur de recherche</p>';
  }
}

function displayPersonsInContainer(persons, container) {
  container.innerHTML = `<div class="persons-grid">${persons.map(person => `
    <div class="person-card" onclick="showPersonDetail(${person.id})">
      ${person.photo ? 
        `<img src="${person.photo}" alt="${person.prenom} ${person.nom}" class="photo">` :
        '<div class="photo" style="background: #ddd; display: flex; align-items: center; justify-content: center; font-size: 2em;">👤</div>'
      }
      <div class="name">${person.prenom || ''} ${person.nom}</div>
      <div class="info">
        ${person.sexe === 'M' ? '♂' : person.sexe === 'F' ? '♀' : '⚲'}
        ${getStatusText(person)}
      </div>
    </div>
  `).join('')}</div>`;
}

// Peupler le sélecteur de personne pour l'arbre
async function populateTreePersonSelect() {
  const select = document.getElementById('tree-person-select');
  if (!select) return;
  
  try {
    const response = await fetch(`${API_URL}/persons`);
    const people = await response.json();
    
    // Trier par nom
    people.sort((a, b) => {
      const nameA = `${a.nom} ${a.prenom}`.toLowerCase();
      const nameB = `${b.nom} ${b.prenom}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    // Peupler le select
    select.innerHTML = '<option value="">-- Sélectionner une personne --</option>';
    people.forEach(person => {
      const birthYear = person.date_naissance ? new Date(person.date_naissance).getFullYear() : '?';
      const option = document.createElement('option');
      option.value = person.id;
      option.textContent = `${person.prenom} ${person.nom} (${birthYear})`;
      select.appendChild(option);
    });
    
    // Sélectionner la première personne par défaut si aucune sélection
    if (people.length > 0 && !select.value) {
      // Trouver une personne avec beaucoup de relations (plus intéressant à afficher)
      const relationsResponse = await fetch(`${API_URL}/relations`);
      const relations = await relationsResponse.json();
      
      // Compter les relations par personne
      const relationCounts = {};
      relations.forEach(rel => {
        relationCounts[rel.person1_id] = (relationCounts[rel.person1_id] || 0) + 1;
        relationCounts[rel.person2_id] = (relationCounts[rel.person2_id] || 0) + 1;
      });
      
      // Trouver la personne avec le plus de relations
      let mostConnected = people[0];
      let maxCount = 0;
      people.forEach(p => {
        const count = relationCounts[p.id] || 0;
        if (count > maxCount) {
          maxCount = count;
          mostConnected = p;
        }
      });
      
      select.value = mostConnected.id;
    }
    
    // Ajouter un event listener pour regénérer l'arbre quand on change de personne
    select.onchange = () => generateCompleteTree();
    
  } catch (error) {
    console.error('Erreur chargement personnes:', error);
    select.innerHTML = '<option value="">Erreur chargement</option>';
  }
}

// Arbre généalogique complet avec Canvas
async function generateCompleteTree() {
  console.log('=== generateCompleteTree appelé ===');
  
  const canvas = document.getElementById('treeCanvas');
  const loadingMsg = document.getElementById('tree-loading');
  const personSelect = document.getElementById('tree-person-select');
  
  console.log('Canvas element:', canvas);
  console.log('Loading message:', loadingMsg);
  
  if (!canvas) {
    console.error('Canvas non trouvé');
    return;
  }
  
  const selectedPersonId = personSelect ? parseInt(personSelect.value) : null;
  if (!selectedPersonId) {
    console.warn('Aucune personne sélectionnée');
    loadingMsg.textContent = 'Veuillez sélectionner une personne';
    loadingMsg.style.display = 'block';
    return;
  }
  
  const ctx = canvas.getContext('2d');
  console.log('Context 2D:', ctx);
  console.log('Personne sélectionnée:', selectedPersonId);
  loadingMsg.style.display = 'block';
  
  try {
    // Récupérer toutes les données via l'API tree qui inclut unions et unionChildren
    const response = await fetch(`${API_URL}/tree`);
    const treeApiData = await response.json();
    
    console.log('Données arbre reçues:', treeApiData);
    
    // Extraire les données
    const allPeople = treeApiData.persons || [];
    const unions = treeApiData.unions || [];
    const unionChildren = treeApiData.unionChildren || [];
    const relations = treeApiData.relations || []; // Relations parent/frere
    
    // Sauvegarder pour utilisation ultérieure
    treeData.people = allPeople;
    treeData.relations = relations;
    treeData.unions = unions;
    treeData.unionChildren = unionChildren;
    
    // Dessiner l'arbre sur le Canvas à partir de la personne sélectionnée
    drawCompleteTreeFromPerson(ctx, canvas, allPeople, relations, unions, unionChildren, selectedPersonId);
    
    loadingMsg.style.display = 'none';
  } catch (error) {
    console.error('Erreur génération arbre:', error);
    loadingMsg.textContent = 'Erreur lors de la génération de l\'arbre';
  }
}

function findRootPeople(people, relations) {
  // Trouver toutes les personnes qui sont enfants
  const childrenIds = new Set();
  relations.forEach(rel => {
    if (rel.type_relation === 'enfant') {
      childrenIds.add(rel.person1_id);
    } else if (rel.type_relation === 'parent') {
      childrenIds.add(rel.person2_id);
    }
  });
  
  // Les racines sont celles qui ne sont jamais enfants
  const roots = people.filter(p => !childrenIds.has(p.id));
  
  // Si aucune racine trouvée, prendre la personne la plus âgée
  if (roots.length === 0 && people.length > 0) {
    const oldest = people.sort((a, b) => {
      const dateA = a.date_naissance ? new Date(a.date_naissance) : new Date('2000-01-01');
      const dateB = b.date_naissance ? new Date(b.date_naissance) : new Date('2000-01-01');
      return dateA - dateB;
    })[0];
    return [oldest];
  }
  
  return roots;
}

function buildCompleteTreeByGenerations(people, relations, roots) {
  const generations = [];
  let currentGeneration = roots;
  const visited = new Set();
  
  // Créer un map des relations pour accès rapide
  const childrenMap = new Map();
  relations.forEach(rel => {
    if (rel.type_relation === 'parent') {
      if (!childrenMap.has(rel.person1_id)) {
        childrenMap.set(rel.person1_id, []);
      }
      childrenMap.get(rel.person1_id).push(rel.person2_id);
    } else if (rel.type_relation === 'enfant') {
      if (!childrenMap.has(rel.person2_id)) {
        childrenMap.set(rel.person2_id, []);
      }
      childrenMap.get(rel.person2_id).push(rel.person1_id);
    }
  });
  
  let generationNumber = 1;
  
  while (currentGeneration.length > 0 && generationNumber < 20) {
    // Ajouter la génération actuelle
    const genPeople = currentGeneration.filter(p => !visited.has(p.id));
    if (genPeople.length === 0) break;
    
    genPeople.forEach(p => visited.add(p.id));
    generations.push({
      number: generationNumber,
      people: genPeople
    });
    
    // Trouver la génération suivante (enfants)
    const nextGen = [];
    currentGeneration.forEach(person => {
      const childrenIds = childrenMap.get(person.id) || [];
      childrenIds.forEach(childId => {
        if (!visited.has(childId)) {
          const child = people.find(p => p.id === childId);
          if (child) {
            nextGen.push(child);
          }
        }
      });
    });
    
    currentGeneration = nextGen;
    generationNumber++;
  }
  
  return generations;
}

/* ========================================
   ANCIENNES FONCTIONS HTML/SVG (Désactivées - Canvas utilisé maintenant)
   ======================================== */

/*
function renderCompleteTree(generations, container, relations) {
  // Cette fonction n'est plus utilisée - le rendu se fait maintenant avec Canvas
}

function drawTreeConnections(generations, relations) {
  // Cette fonction n'est plus utilisée - le rendu se fait maintenant avec Canvas
}
*/

// Utilitaires
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
}

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
