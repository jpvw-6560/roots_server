-- ====================================================================
-- CRÉATION DE LA STRUCTURE AVEC TABLE PARENTS (Nouvelle base)
-- Date: 2026-05-24
-- ====================================================================

USE neogenea;

-- Table des personnes
CREATE TABLE IF NOT EXISTS persons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100),
  prenom VARCHAR(100) NOT NULL,
  nom_jeune_fille VARCHAR(100),
  sexe ENUM('M', 'F') NOT NULL,
  date_naissance DATE,
  lieu_naissance VARCHAR(255),
  date_deces DATE,
  lieu_deces VARCHAR(255),
  biographie TEXT,
  vivant BOOLEAN DEFAULT TRUE,
  photo_principale VARCHAR(255),
  id_parents INT DEFAULT NULL,
  ordre_naissance INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nom (nom),
  INDEX idx_prenom (prenom),
  INDEX idx_parents (id_parents)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des couples de parents
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

-- Ajouter la contrainte de clé étrangère pour id_parents
ALTER TABLE persons 
ADD FOREIGN KEY (id_parents) REFERENCES parents(id) ON DELETE SET NULL;

-- Table des médias
CREATE TABLE IF NOT EXISTS medias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  person_id INT,
  type_media ENUM('photo', 'video', 'document', 'audio') NOT NULL,
  chemin_fichier VARCHAR(500) NOT NULL,
  titre VARCHAR(200),
  description TEXT,
  date_media DATE,
  principale BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
  INDEX idx_person_media (person_id),
  INDEX idx_principale (principale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des relations (conservée pour compatibilité legacy)
CREATE TABLE IF NOT EXISTS relations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  person1_id INT NOT NULL,
  person2_id INT NOT NULL,
  type_relation ENUM('parent', 'enfant', 'frere', 'soeur', 'conjoint', 'autre') NOT NULL,
  date_debut DATE,
  date_fin DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (person1_id) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (person2_id) REFERENCES persons(id) ON DELETE CASCADE,
  INDEX idx_person1 (person1_id),
  INDEX idx_person2 (person2_id),
  INDEX idx_type (type_relation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- DONNÉES DE TEST
-- ====================================================================

-- Insérer quelques personnes de test
INSERT INTO persons (prenom, nom, sexe, date_naissance, vivant) VALUES
('Jean-Pol', 'Van Wymeersch', 'M', '1960-05-15', TRUE),
('Michelle', 'Cocriamont', 'F', '1962-08-20', TRUE),
('Olga', 'Mosala', 'F', '1965-03-10', TRUE),
('François', 'Van Wymeersch', 'M', '1930-01-10', FALSE),
('Solidea', 'Mella', 'F', '1932-07-22', FALSE),
('Bernard', 'Van Wymeersch', 'M', '1958-02-14', TRUE),
('Thierry', 'Van Wymeersch', 'M', '1964-11-30', TRUE),
('Achille', 'Mella', 'M', '1900-05-12', FALSE),
('Adele', 'Pizzinatto', 'F', '1902-09-18', FALSE),
('Omer', 'Van Wymeersch', 'M', '1898-03-25', FALSE),
('Adronie', 'Reynaert', 'F', '1900-11-08', FALSE);

-- Créer les couples de parents
INSERT INTO parents (id_pere, id_mere, date_mariage, lieu_mariage) VALUES
(10, 11, '1925-06-15', 'Belgique'),  -- id=1: Omer + Adronie (parents de François)
(8, 9, '1928-04-20', 'Italie'),      -- id=2: Achille + Adele (parents de Solidea)
(4, 5, '1955-09-10', NULL);           -- id=3: François + Solidea (parents de Jean-Pol, Bernard, Thierry)

-- Assigner les parents aux enfants
UPDATE persons SET id_parents = 3 WHERE id IN (1, 6, 7);  -- Jean-Pol, Bernard, Thierry -> François + Solidea
UPDATE persons SET id_parents = 1 WHERE id = 4;           -- François -> Omer + Adronie
UPDATE persons SET id_parents = 2 WHERE id = 5;           -- Solidea -> Achille + Adele

-- Créer les couples de Jean-Pol
INSERT INTO parents (id_pere, id_mere, date_mariage) VALUES
(1, 2, '1985-06-20'),  -- id=4: Jean-Pol + Michelle
(1, 3, '2000-03-15');  -- id=5: Jean-Pol + Olga

-- Ajouter des enfants pour Jean-Pol
INSERT INTO persons (prenom, nom, sexe, date_naissance, vivant, id_parents) VALUES
('Yohan', 'Van Wymeersch', 'M', '1986-08-10', TRUE, 4),
('Gaël', 'Van Wymeersch', 'M', '1989-02-22', TRUE, 4),
('Eve', 'Van Wymeersch', 'F', '1992-11-15', TRUE, 4),
('François', 'Van Wymeersch', 'M', '2001-05-30', TRUE, 5),
('Célia', 'Van Wymeersch', 'F', '2003-09-12', TRUE, 5);

-- ====================================================================
-- VÉRIFICATIONS
-- ====================================================================

SELECT '=== COUPLES DE PARENTS ===' as '';
SELECT p.id, 
       CONCAT(pere.prenom, ' ', pere.nom) as père,
       CONCAT(mere.prenom, ' ', mere.nom) as mère,
       p.date_mariage
FROM parents p
LEFT JOIN persons pere ON p.id_pere = pere.id
LEFT JOIN persons mere ON p.id_mere = mere.id;

SELECT '=== PERSONNES AVEC LEURS PARENTS ===' as '';
SELECT 
  child.id,
  CONCAT(child.prenom, ' ', child.nom) as personne,
  child.id_parents,
  CONCAT(pere.prenom, ' ', pere.nom) as père,
  CONCAT(mere.prenom, ' ', mere.nom) as mère
FROM persons child
LEFT JOIN parents p ON child.id_parents = p.id
LEFT JOIN persons pere ON p.id_pere = pere.id
LEFT JOIN persons mere ON p.id_mere = mere.id
ORDER BY child.id;

SELECT '=== FRATRIES ===' as '';
SELECT 
  p.id as couple_id,
  CONCAT(pere.prenom, ' ', pere.nom) as père,
  CONCAT(mere.prenom, ' ', mere.nom) as mère,
  GROUP_CONCAT(CONCAT(child.prenom, ' ', child.nom) ORDER BY child.date_naissance SEPARATOR ', ') as enfants
FROM parents p
LEFT JOIN persons pere ON p.id_pere = pere.id
LEFT JOIN persons mere ON p.id_mere = mere.id
LEFT JOIN persons child ON child.id_parents = p.id
GROUP BY p.id, pere.prenom, pere.nom, mere.prenom, mere.nom;
