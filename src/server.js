// src/server.js
// Serveur principal de l'application NeoGenea

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('../config/database');
const config = require('../config/config');

// Import des routes
const personsRoutes = require('../routes/persons');
const relationsRoutes = require('../routes/relations');
const mediasRoutes = require('../routes/medias');
const treeRoutes = require('../routes/tree');
const unionsRoutes = require('../routes/unions');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes API
app.use('/api/persons', personsRoutes);
app.use('/api/relations', relationsRoutes);
app.use('/api/medias', mediasRoutes);
app.use('/api/tree', treeRoutes);
app.use('/api/unions', unionsRoutes);

// Route pour la configuration
app.get('/api/config', (req, res) => {
  res.json({
    typeRelations: config.typeRelations,
    sexes: config.sexes,
    mediaTypes: config.mediaTypes
  });
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'NeoGenea'
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur:', err.stack);
  res.status(500).json({ 
    error: 'Erreur serveur',
    message: config.env === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Initialisation de la base de données et démarrage du serveur
async function startServer() {
  try {
    await initDatabase();
    console.log('✅ Base de données prête');
    
    // Écoute sur toutes les interfaces (0.0.0.0) pour permettre l'accès distant
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`\n========================================`);
      console.log(`🌳 NEOGENEA - Serveur de généalogie`);
      console.log(`========================================`);
      console.log(`📡 Serveur démarré sur le port ${config.port}`);
      console.log(`🌐 URL locale: http://localhost:${config.port}/`);
      console.log(`📁 Uploads dans: ${config.uploadDir}`);
      console.log(`⚙️  Environnement: ${config.env}`);
      console.log(`📅 ${new Date().toLocaleString('fr-FR')}`);
      console.log(`========================================\n`);
    });
  } catch (err) {
    console.error('❌ Erreur démarrage serveur:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
