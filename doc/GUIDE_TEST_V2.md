# 🧪 Guide de Test - NeoGenea Version 2.0

## 📱 Accès à l'Application

Ouvrez votre navigateur et accédez à:
- **Desktop**: http://localhost:3007
- **Mobile/Tablette**: http://192.168.129.50:3007 (ou votre IP serveur)

---

## ✅ Tests à Effectuer

### 1️⃣ Test du Mode Verrouillage (Priorité Haute)

#### État initial (verrouillé)
- [ ] Le toggle dans le header affiche "🔒 Verrouillé"
- [ ] Le bouton "➕ Nouvelle personne" est grisé
- [ ] Cliquer sur "➕ Nouvelle personne" → Message d'erreur apparaît
- [ ] Message: "🔒 Veuillez activer le mode édition..."

#### Activation du mode édition
- [ ] Cliquer sur le toggle switch
- [ ] Le label change en "🔓 Édition activée"
- [ ] Le bouton "➕ Nouvelle personne" devient actif
- [ ] Le bouton retrouve sa couleur normale

#### Test d'une action
- [ ] Cliquer sur "➕ Nouvelle personne"
- [ ] Le formulaire s'ouvre
- [ ] Remplir le formulaire et enregistrer → Succès

---

### 2️⃣ Test du Tri Chronologique

#### Vue Liste - Plus jeunes d'abord (défaut)
- [ ] Aller sur la vue "📋 Liste"
- [ ] Vérifier que le sélecteur affiche "Plus jeunes d'abord"
- [ ] La première personne doit être Emma DUBOIS (née en 2022)
- [ ] La dernière personne doit être Henri DUBOIS (né en 1918)

#### Vue Liste - Plus âgés d'abord
- [ ] Changer le sélecteur vers "Plus âgés d'abord"
- [ ] La liste se réorganise immédiatement
- [ ] La première personne doit être Henri DUBOIS (1918)
- [ ] La dernière personne doit être Emma DUBOIS (2022)

---

### 3️⃣ Test des Vues Cartes/Tableau

#### Vue Cartes (défaut)
- [ ] Sur la vue Liste, le bouton "🎴 Cartes" est actif (vert)
- [ ] Les personnes sont affichées en grille de cartes
- [ ] Chaque carte montre: photo, nom, prénom, sexe, statut, date
- [ ] Survol d'une carte → Effet visuel (elevation)
- [ ] Clic sur une carte → Affichage du détail

#### Vue Tableau
- [ ] Cliquer sur le bouton "📊 Tableau"
- [ ] L'affichage passe en tableau
- [ ] Colonnes visibles: Photo | Prénom | Nom | Sexe | Dates | Statut | Actions
- [ ] 3 boutons par ligne: ✏️ (Modifier) | 👁️ (Voir) | 🗑️ (Supprimer)
- [ ] Survol d'une ligne → Changement de couleur de fond

#### Retour aux cartes
- [ ] Cliquer sur "🎴 Cartes"
- [ ] Retour à l'affichage en grille

---

### 4️⃣ Test de l'Arbre Généalogique Complet

#### Ouverture de la vue
- [ ] Cliquer sur "🌳 Arbre" dans le menu
- [ ] L'arbre se génère automatiquement (pas de sélection de personne)
- [ ] Message de chargement visible brièvement

#### Vérification de la structure
- [ ] **Génération 1** visible: Henri et Jeanne DUBOIS (racines)
- [ ] **Génération 2** visible: 3 enfants (Pierre, Marie, Jean)
- [ ] **Génération 3** visible: 6 petits-enfants
- [ ] **Génération 4** visible: 5 arrière-petits-enfants
- [ ] **Génération 5** visible: 2 arrière-arrière-petits-enfants (Lucas et Emma)
- [ ] Total: 5 générations affichées

#### Informations par personne
- [ ] Chaque carte affiche: Nom, Prénom
- [ ] Dates affichées: "1918 - 2008" (exemple Henri)
- [ ] Symbole sexe visible: ♂ ou ♀
- [ ] Clic sur une personne → Redirection vers le détail

#### Contrôles de zoom
- [ ] Cliquer sur "🔍+ Zoom +" → L'arbre s'agrandit
- [ ] Cliquer plusieurs fois → Zoom max atteint (200%)
- [ ] Cliquer sur "🔍− Zoom -" → L'arbre rétrécit
- [ ] Cliquer plusieurs fois → Zoom min atteint (50%)
- [ ] Cliquer sur "↻ Reset" → Retour au zoom 100%

---

### 5️⃣ Test du Menu Responsive (Mobile/Tablette)

#### Préparation
- [ ] Ouvrir DevTools du navigateur (F12)
- [ ] Activer le mode "Device Toolbar" (Ctrl+Shift+M ou Cmd+Shift+M)
- [ ] Sélectionner "iPhone 12" ou similaire (largeur < 768px)

#### Menu burger
- [ ] Le menu latéral disparaît
- [ ] Une icône ☰ apparaît en haut à gauche
- [ ] Le titre "NeoGenea" est plus petit
- [ ] Les stats passent en vertical

#### Ouverture du menu
- [ ] Cliquer sur ☰
- [ ] Le menu latéral glisse depuis la gauche
- [ ] Un overlay sombre apparaît à droite
- [ ] Le header "Menu" et le bouton ✕ sont visibles

#### Navigation mobile
- [ ] Cliquer sur "🌳 Arbre"
- [ ] Le menu se ferme automatiquement
- [ ] La vue Arbre s'affiche
- [ ] Réouvrir le menu avec ☰

#### Fermeture alternative
- [ ] Menu ouvert
- [ ] Cliquer sur le bouton ✕ → Menu se ferme
- [ ] Réouvrir le menu
- [ ] Cliquer sur l'overlay sombre → Menu se ferme

#### Vues responsive
- [ ] **Liste**: Cartes en colonne unique
- [ ] **Tableau**: Police réduite, scroll horizontal si nécessaire
- [ ] **Arbre**: Générations empilées verticalement
- [ ] **Formulaire**: Champs en colonne unique
- [ ] **Boutons**: Largeur 100%

---

### 6️⃣ Test des Détails d'une Personne

#### Navigation vers le détail
- [ ] Depuis la vue Liste, cliquer sur une personne
- [ ] La vue "Détail" s'affiche

#### Informations visibles
- [ ] Photo principale (ou icône par défaut)
- [ ] Nom complet
- [ ] Sexe
- [ ] Dates et lieux de naissance/décès
- [ ] Statut vivant/décédé
- [ ] Biographie (si renseignée)

#### Boutons d'action (mode édition désactivé)
- [ ] 3 boutons visibles: ✏️ Modifier | 🔗 Ajouter relation | 🗑️ Supprimer
- [ ] Les 3 boutons sont grisés
- [ ] Clic sur un bouton → Message "🔒 Veuillez activer..."

#### Boutons d'action (mode édition activé)
- [ ] Activer le mode édition
- [ ] Les 3 boutons deviennent actifs
- [ ] Tester "✏️ Modifier" → Formulaire prérempli
- [ ] Retour au détail

#### Section Relations
- [ ] Liste des relations visible
- [ ] Type de relation affiché: 👨 Parent, 👶 Enfant, 💑 Conjoint, etc.
- [ ] Nom de la personne liée
- [ ] Bouton 🗑️ pour supprimer (grisé si mode verrouillé)

---

### 7️⃣ Test de la Recherche

#### Interface de recherche
- [ ] Cliquer sur "🔍 Rechercher" dans le menu
- [ ] Champ de recherche visible
- [ ] Message: "Entrez un terme de recherche"

#### Recherche active
- [ ] Taper "Du" (2 caractères)
- [ ] Les résultats apparaissent en temps réel
- [ ] Plusieurs personnes nommées "Dubois" visibles
- [ ] Format: Cartes identiques à la vue Liste

#### Recherche précise
- [ ] Effacer et taper "Emma"
- [ ] Résultat unique: Emma DUBOIS
- [ ] Clic sur le résultat → Affichage du détail

#### Recherche sans résultat
- [ ] Taper "ZZZZ"
- [ ] Message: "Aucun résultat"

---

### 8️⃣ Test CRUD Complet (avec mode édition)

#### Création
- [ ] Activer le mode édition
- [ ] Cliquer sur "➕ Ajouter" dans le menu
- [ ] Remplir le formulaire:
  - Nom: TEST
  - Prénom: Personne
  - Sexe: Masculin
  - Date naissance: 2000-01-01
  - Vivant: Coché
- [ ] Cliquer sur "💾 Enregistrer"
- [ ] Message de succès
- [ ] Retour à la liste
- [ ] Nouvelle personne visible

#### Modification
- [ ] Trouver "Personne TEST" dans la liste
- [ ] Clic sur la carte → Détail
- [ ] Clic sur "✏️ Modifier"
- [ ] Changer le prénom en "Test Modifié"
- [ ] Enregistrer
- [ ] Vérifier que le changement est visible

#### Ajout de relation
- [ ] Sur le détail de "Test Modifié TEST"
- [ ] Clic sur "🔗 Ajouter relation"
- [ ] Modal s'ouvre
- [ ] Sélectionner une personne existante
- [ ] Type: Parent
- [ ] Créer la relation
- [ ] La relation apparaît dans la section Relations

#### Suppression de relation
- [ ] Sur le détail de la personne
- [ ] Trouver la relation ajoutée
- [ ] Clic sur 🗑️ à côté de la relation
- [ ] Confirmer la suppression
- [ ] La relation disparaît

#### Suppression de personne
- [ ] Clic sur "🗑️ Supprimer"
- [ ] Confirmer la suppression
- [ ] Retour à la liste
- [ ] La personne n'est plus visible

---

## 🎯 Checklist Finale

### Fonctionnalités Core
- [ ] Mode verrouillage fonctionne parfaitement
- [ ] Tri chronologique (2 sens) opérationnel
- [ ] Vue Cartes + Vue Tableau fonctionnent
- [ ] Arbre généalogique complet s'affiche
- [ ] Menu burger fonctionne sur mobile

### Design et UX
- [ ] Animations fluides (transitions)
- [ ] Couleurs cohérentes (thème vert)
- [ ] Boutons hover avec effet
- [ ] Messages de feedback visibles
- [ ] Loading states présents

### Responsive
- [ ] Desktop (> 1024px): Sidebar fixe visible
- [ ] Tablette (768-1024px): Sidebar réduite
- [ ] Mobile (< 768px): Menu burger
- [ ] Toutes les vues adaptées

### Sécurité
- [ ] Mode verrouillé par défaut
- [ ] Impossible de modifier sans déverrouiller
- [ ] Message clair en cas de tentative
- [ ] Confirmation avant suppression

---

## 📊 Résultats Attendus

### Sur Desktop
- Navigation fluide avec sidebar toujours visible
- Arbre généalogique lisible avec zoom
- Tableau Excel confortable
- Toutes les colonnes visibles

### Sur Mobile
- Navigation via menu burger
- Cartes en colonne unique
- Formulaires verticaux
- Boutons pleine largeur
- Arbre zoomable et scrollable

### Performance
- Chargement rapide (< 1s)
- Transitions fluides (60 FPS)
- Pas de lag lors du tri
- Zoom réactif

---

## 🐛 Problèmes Potentiels et Solutions

### Le serveur ne démarre pas
```bash
cd /home/jpvw/Documents/node_appli/roots_server
pkill -f "node.*server.js"
node src/server.js
```

### Les styles ne se chargent pas
- Vider le cache navigateur: Ctrl+Shift+Del
- Hard reload: Ctrl+F5

### Les fonctions JavaScript ne marchent pas
- Ouvrir la console (F12)
- Vérifier les erreurs JavaScript
- Recharger la page

### L'arbre ne se génère pas
- Vérifier qu'il y a des données: http://localhost:3007/api/persons
- Vérifier qu'il y a des relations: http://localhost:3007/api/relations

---

## ✅ Test Réussi Si...

1. ✅ Le mode verrouillage empêche toute modification
2. ✅ Le tri chronologique fonctionne dans les 2 sens
3. ✅ Les vues Cartes et Tableau s'affichent correctement
4. ✅ L'arbre généalogique complet montre toutes les 5 générations
5. ✅ Le menu burger fonctionne sur mobile
6. ✅ Toutes les vues sont responsive
7. ✅ Les contrôles de zoom fonctionnent
8. ✅ Le CRUD complet fonctionne (après déverrouillage)

---

**Bon test ! 🚀**

En cas de problème, consultez le fichier `doc/AMELIORATIONS_V2.md` pour plus de détails techniques.
