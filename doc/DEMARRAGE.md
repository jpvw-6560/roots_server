# Guide de démarrage - NeoGenea

## Prérequis

- Node.js (version 14 ou supérieure)
- MySQL (version 5.7 ou supérieure)
- npm

## Installation

### 1. Installation des dépendances

```bash
cd ~/Documents/node_appli/roots_server
npm install
```

### 2. Configuration de la base de données

#### Créer la base de données MySQL

```bash
mysql -u root -p
```

```sql
CREATE DATABASE neogenea CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
```

#### Configurer les identifiants

1. Copier le fichier d'exemple de configuration :
```bash
cp .env.example .env
```

2. Éditer le fichier `.env` avec vos identifiants MySQL :
```
PORT=3007
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=neogenea
DB_PORT=3306

UPLOAD_DIR=./uploads
```

### 3. Démarrage

```bash
npm start
```

Le serveur démarre sur http://localhost:3007

Les tables de la base de données sont créées automatiquement au premier démarrage.

## Mode développement

Pour le développement avec rechargement automatique :

```bash
npm run dev
```

## Vérification

### Tester la connexion au serveur

```bash
curl http://localhost:3007/api/health
```

Devrait retourner :
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "NeoGenea"
}
```

### Vérifier que le port est ouvert

```bash
ss -tlnp | grep :3007
```

## Structure de la base de données

Les tables suivantes sont créées automatiquement :

- **persons** : Informations sur les personnes
- **relations** : Relations entre personnes (parent, enfant, conjoint, etc.)
- **medias** : Photos et documents associés aux personnes
- **familles** : Groupement de familles (optionnel)

## Utilisation

1. Ouvrir un navigateur web
2. Aller sur http://localhost:3007
3. Commencer à ajouter des personnes et créer votre arbre généalogique

## Arrêt du serveur

- Dans le terminal : `Ctrl + C`
- Ou depuis un autre terminal :
```bash
pkill -f 'node.*roots_server'
```

## Dépannage

### Erreur de connexion MySQL

Vérifier que MySQL est démarré :
```bash
sudo systemctl status mysql
# ou
sudo service mysql status
```

Démarrer MySQL si nécessaire :
```bash
sudo systemctl start mysql
```

### Port déjà utilisé

Si le port 3007 est déjà utilisé, modifier le fichier `.env` :
```
PORT=3008
```

### Tables non créées

Se connecter manuellement à MySQL et vérifier :
```sql
USE neogenea;
SHOW TABLES;
```

Si les tables ne sont pas créées, vérifier les logs au démarrage du serveur.
