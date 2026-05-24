-- ====================================================================
-- MIGRATION: Passage de unions/union_children vers table parents
-- Date: 2026-05-24
-- ====================================================================

-- Étape 1: Créer la nouvelle table parents
CREATE TABLE IF NOT EXISTS parents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_pere INT NOT NULL,
  id_mere INT NOT NULL,
  date_mariage DATE,
  lieu_mariage VARCHAR(255),
  date_divorce DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pere) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (id_mere) REFERENCES persons(id) ON DELETE CASCADE,
  INDEX idx_pere (id_pere),
  INDEX idx_mere (id_mere)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Étape 2: Ajouter la colonne id_parents dans persons
ALTER TABLE persons 
ADD COLUMN id_parents INT DEFAULT NULL AFTER vivant,
ADD INDEX idx_parents (id_parents);

-- Étape 3: Migrer les données de unions vers parents
-- Pour chaque union, créer une entrée dans parents
INSERT INTO parents (id_pere, id_mere, date_mariage, lieu_mariage, date_divorce)
SELECT 
  person1_id as id_pere,
  person2_id as id_mere,
  date_debut as date_mariage,
  lieu as lieu_mariage,
  date_fin as date_divorce
FROM unions
WHERE person1_id IS NOT NULL AND person2_id IS NOT NULL;

-- Étape 4: Créer une table temporaire pour mapper union_id -> parents_id
CREATE TEMPORARY TABLE union_to_parents_map AS
SELECT 
  u.id as union_id,
  p.id as parents_id
FROM unions u
INNER JOIN parents p ON u.person1_id = p.id_pere AND u.person2_id = p.id_mere;

-- Étape 5: Mettre à jour persons.id_parents depuis union_children
UPDATE persons per
INNER JOIN union_children uc ON per.id = uc.child_id
INNER JOIN union_to_parents_map m ON uc.union_id = m.union_id
SET per.id_parents = m.parents_id;

-- Étape 6: Ajouter la contrainte de clé étrangère
ALTER TABLE persons 
ADD FOREIGN KEY (id_parents) REFERENCES parents(id) ON DELETE SET NULL;

-- Étape 7: Renommer les anciennes tables (backup)
-- Ne pas supprimer tout de suite, juste renommer pour backup
RENAME TABLE unions TO unions_OLD;
RENAME TABLE union_children TO union_children_OLD;

-- ====================================================================
-- VÉRIFICATIONS (à exécuter après migration)
-- ====================================================================

-- Compter les parents créés
-- SELECT COUNT(*) as nb_parents FROM parents;

-- Compter les personnes avec parents assignés
-- SELECT COUNT(*) as nb_enfants FROM persons WHERE id_parents IS NOT NULL;

-- Vérifier une fratrie (même id_parents)
-- SELECT id, prenom, nom, id_parents 
-- FROM persons 
-- WHERE id_parents = 1
-- ORDER BY date_naissance;

-- ====================================================================
-- ROLLBACK (si problème)
-- ====================================================================
-- RENAME TABLE unions_OLD TO unions;
-- RENAME TABLE union_children_OLD TO union_children;
-- ALTER TABLE persons DROP FOREIGN KEY persons_ibfk_X; -- remplacer X par le bon numéro
-- ALTER TABLE persons DROP COLUMN id_parents;
-- DROP TABLE parents;
