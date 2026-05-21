-- Script de nettoyage des relations en double et incorrectes
-- Date: 21 mai 2026

USE neogenea;

-- 1. Afficher l'état actuel
SELECT 'AVANT NETTOYAGE - Total relations:' as info, COUNT(*) as count FROM relations;
SELECT type_relation, COUNT(*) as count FROM relations GROUP BY type_relation;

-- 2. Supprimer les relations "enfant" (redondantes avec "parent")
-- La relation "parent" est la référence, "enfant" est l'inverse redondant
DELETE FROM relations WHERE type_relation = 'enfant';
SELECT 'Après suppression relations enfant:' as info, COUNT(*) as count FROM relations;

-- 3. Supprimer les relations "conjoint" (remplacées par le modèle Union)
-- Les unions sont maintenant gérées dans la table unions
DELETE FROM relations WHERE type_relation = 'conjoint';
SELECT 'Après suppression relations conjoint:' as info, COUNT(*) as count FROM relations;

-- 4. Pour les relations "frere", ne garder qu'une seule direction (person1_id < person2_id)
-- Cela évite les doublons bidirectionnels
DELETE r1 FROM relations r1
INNER JOIN relations r2 ON 
  r1.type_relation = 'frere' AND
  r2.type_relation = 'frere' AND
  r1.person1_id = r2.person2_id AND
  r1.person2_id = r2.person1_id AND
  r1.id > r2.id;
SELECT 'Après suppression doublons frere:' as info, COUNT(*) as count FROM relations;

-- 5. Corriger les relations parent incorrectes
-- Problème spécifique: Jean-Pol (ID 8) parent de François (ID 15) - à corriger si nécessaire
-- Jean-Pol (né 1953) est le père de François fils (né 1995) - relation correcte ID 33
-- François père (ID 5, né 1926) est le père de Jean-Pol (ID 8) - relation correcte ID 13

-- Vérifier les doublons de relations parent
SELECT 'Relations parent en double (même couple parent-enfant):' as info;
SELECT person1_id, person2_id, COUNT(*) as count 
FROM relations 
WHERE type_relation = 'parent'
GROUP BY person1_id, person2_id
HAVING count > 1;

-- Supprimer les relations parent en double en gardant la plus ancienne (ID le plus petit)
DELETE r1 FROM relations r1
INNER JOIN relations r2 ON 
  r1.type_relation = 'parent' AND
  r2.type_relation = 'parent' AND
  r1.person1_id = r2.person1_id AND
  r1.person2_id = r2.person2_id AND
  r1.id > r2.id;
SELECT 'Après suppression doublons parent:' as info, COUNT(*) as count FROM relations;

-- 6. État final
SELECT 'APRES NETTOYAGE - Total relations:' as info, COUNT(*) as count FROM relations;
SELECT type_relation, COUNT(*) as count FROM relations GROUP BY type_relation;

-- 7. Vérifier les relations restantes pour Jean-Pol
SELECT 'Relations finales pour Jean-Pol:' as info;
SELECT r.id, p1.prenom as person1, p1.nom as nom1, r.type_relation, p2.prenom as person2, p2.nom as nom2 
FROM relations r 
JOIN persons p1 ON r.person1_id = p1.id 
JOIN persons p2 ON r.person2_id = p2.id 
WHERE p1.prenom = 'Jean-Pol' OR p2.prenom = 'Jean-Pol' 
ORDER BY r.type_relation, r.id;
