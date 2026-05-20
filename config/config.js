// config/config.js
// Configuration générale de l'application NeoGenea

const path = require('path');

module.exports = {
  // Port du serveur
  port: process.env.PORT || 3007,
  
  // Environnement
  env: process.env.NODE_ENV || 'development',
  
  // Répertoire des uploads
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'),
  
  // Types de médias acceptés
  mediaTypes: {
    photo: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    document: ['.pdf', '.doc', '.docx', '.txt'],
    video: ['.mp4', '.avi', '.mov', '.mkv'],
    audio: ['.mp3', '.wav', '.ogg'],
    acte: ['.pdf', '.jpg', '.jpeg', '.png']
  },
  
  // Taille maximale des fichiers (10 MB)
  maxFileSize: 10 * 1024 * 1024,
  
  // Types de relations
  typeRelations: ['parent', 'enfant', 'conjoint', 'frere', 'soeur'],
  
  // Sexes possibles
  sexes: ['M', 'F', 'Autre']
};
