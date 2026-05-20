// scripts/seed-demo-data.js
// Script pour peupler la base de données avec des données de démonstration

require('dotenv').config();
const { pool } = require('../config/database');

async function seedData() {
  console.log('🌱 Insertion des données de démonstration...\n');
  
  try {
    const connection = await pool.getConnection();
    
    // Vider les tables existantes
    console.log('🗑️  Nettoyage des données existantes...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE medias');
    await connection.query('TRUNCATE TABLE relations');
    await connection.query('TRUNCATE TABLE persons');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Tables nettoyées\n');
    
    // Insertion des personnes
    console.log('👥 Insertion des personnes...');
    
    const persons = [
      // Génération 1 (Arrière-grands-parents)
      { nom: 'Van Wymeersch', prenom: 'Omer', sexe: 'M', date_naissance: '1895-01-01', lieu_naissance: 'Belgique', date_deces: '1970-01-01', lieu_deces: 'Belgique', vivant: false },
      { nom: 'Reynaert', prenom: 'Adronie', sexe: 'F', date_naissance: '1898-01-01', lieu_naissance: 'Belgique', date_deces: '1975-01-01', lieu_deces: 'Belgique', vivant: false },
      { nom: 'Mella', prenom: 'Achille', sexe: 'M', date_naissance: '1893-01-01', lieu_naissance: 'Italie', date_deces: '1968-01-01', lieu_deces: 'Belgique', vivant: false },
      { nom: 'Pizzinatto', prenom: 'Adele', sexe: 'F', date_naissance: '1896-01-01', lieu_naissance: 'Italie', date_deces: '1972-01-01', lieu_deces: 'Belgique', vivant: false },
      
      // Génération 2 (Parents)
      { nom: 'Van Wymeersch', prenom: 'François', sexe: 'M', date_naissance: '1926-01-01', lieu_naissance: 'Belgique', date_deces: '2010-01-01', lieu_deces: 'Belgique', vivant: false },
      { nom: 'Mella', prenom: 'Solidea', sexe: 'F', date_naissance: '1926-01-01', lieu_naissance: 'Belgique', date_deces: '2016-01-01', lieu_deces: 'Belgique', vivant: false },
      
      // Génération 3 (Fratrie)
      { nom: 'Van Wymeersch', prenom: 'Bernard', sexe: 'M', date_naissance: '1950-01-01', lieu_naissance: 'Belgique', date_deces: '2005-01-01', lieu_deces: 'Belgique', vivant: false },
      { nom: 'Van Wymeersch', prenom: 'Jean-Pol', sexe: 'M', date_naissance: '1953-01-01', lieu_naissance: 'Belgique', vivant: true, biographie: 'JPVW' },
      { nom: 'Van Wymeersch', prenom: 'Thierry Daniel Ghislain', sexe: 'M', date_naissance: '1955-01-01', lieu_naissance: 'Belgique', vivant: true },
      
      // Conjointes de Jean-Pol
      { nom: 'Cocriamont', prenom: 'Michelle', sexe: 'F', date_naissance: '1955-01-01', lieu_naissance: 'Belgique', vivant: true },
      { nom: 'Mosala', prenom: 'Olga', sexe: 'F', date_naissance: '1960-01-01', lieu_naissance: 'Belgique', vivant: true },
      
      // Génération 4 (Enfants de Jean-Pol - Premier mariage)
      { nom: 'Van Wymeersch', prenom: 'Yohan Bernard Ghislain', sexe: 'M', date_naissance: '1984-01-01', lieu_naissance: 'Belgique', vivant: true },
      { nom: 'Van Wymeersch', prenom: 'Gaël Pascal Denis Ghislain', sexe: 'M', date_naissance: '1987-01-01', lieu_naissance: 'Belgique', vivant: true },
      { nom: 'Van Wymeersch', prenom: 'Eve Marie Ghislaine', sexe: 'F', date_naissance: '1989-01-01', lieu_naissance: 'Belgique', vivant: true },
      
      // Génération 4 (Enfants de Jean-Pol - Deuxième mariage)
      { nom: 'Van Wymeersch', prenom: 'François', sexe: 'M', date_naissance: '1995-01-01', lieu_naissance: 'Belgique', vivant: true },
      { nom: 'Van Wymeersch', prenom: 'Célia', sexe: 'F', date_naissance: '1998-01-01', lieu_naissance: 'Belgique', vivant: true }
    ];
    
    const insertedIds = [];
    for (const person of persons) {
      const [result] = await connection.query(
        'INSERT INTO persons (nom, prenom, nom_jeune_fille, sexe, date_naissance, lieu_naissance, date_deces, lieu_deces, vivant, biographie) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [person.nom, person.prenom, person.nom_jeune_fille || null, person.sexe, 
         person.date_naissance, person.lieu_naissance, person.date_deces || null, 
         person.lieu_deces || null, person.vivant, person.biographie || null]
      );
      insertedIds.push(result.insertId);
      console.log(`  ✓ ${person.prenom} ${person.nom}`);
    }
    
    console.log(`\n✅ ${insertedIds.length} personnes insérées\n`);
    
    // Création des relations
    console.log('🔗 Création des relations familiales...');
    
    const relations = [
      // Omer & Adronie sont les parents de François (génération 1 → 2)
      { person1_id: insertedIds[0], person2_id: insertedIds[4], type: 'parent', notes: 'Famille Van Wymeersch' },
      { person1_id: insertedIds[1], person2_id: insertedIds[4], type: 'parent' },
      
      // Achille & Adele sont les parents de Solidea (génération 1 → 2)
      { person1_id: insertedIds[2], person2_id: insertedIds[5], type: 'parent', notes: 'Famille Mella' },
      { person1_id: insertedIds[3], person2_id: insertedIds[5], type: 'parent' },
      
      // François & Solidea sont les parents de Bernard, Jean-Pol et Thierry (génération 2 → 3)
      { person1_id: insertedIds[4], person2_id: insertedIds[6], type: 'parent', notes: 'Enfants Van Wymeersch' },
      { person1_id: insertedIds[5], person2_id: insertedIds[6], type: 'parent' },
      { person1_id: insertedIds[4], person2_id: insertedIds[7], type: 'parent' },
      { person1_id: insertedIds[5], person2_id: insertedIds[7], type: 'parent' },
      { person1_id: insertedIds[4], person2_id: insertedIds[8], type: 'parent' },
      { person1_id: insertedIds[5], person2_id: insertedIds[8], type: 'parent' },
      
      // Jean-Pol & Michelle sont les parents de Yohan, Gaël et Eve (génération 3 → 4, premier mariage)
      { person1_id: insertedIds[7], person2_id: insertedIds[11], type: 'parent', notes: 'Premier mariage Jean-Pol' },
      { person1_id: insertedIds[9], person2_id: insertedIds[11], type: 'parent' },
      { person1_id: insertedIds[7], person2_id: insertedIds[12], type: 'parent' },
      { person1_id: insertedIds[9], person2_id: insertedIds[12], type: 'parent' },
      { person1_id: insertedIds[7], person2_id: insertedIds[13], type: 'parent' },
      { person1_id: insertedIds[9], person2_id: insertedIds[13], type: 'parent' },
      
      // Jean-Pol & Olga sont les parents de François et Célia (génération 3 → 4, deuxième mariage)
      { person1_id: insertedIds[7], person2_id: insertedIds[14], type: 'parent', notes: 'Deuxième mariage Jean-Pol' },
      { person1_id: insertedIds[10], person2_id: insertedIds[14], type: 'parent' },
      { person1_id: insertedIds[7], person2_id: insertedIds[15], type: 'parent' },
      { person1_id: insertedIds[10], person2_id: insertedIds[15], type: 'parent' },
      
      // Mariages / Conjoints
      { person1_id: insertedIds[0], person2_id: insertedIds[1], type: 'conjoint', date_debut: '1920-01-01', notes: 'Omer & Adronie' },
      { person1_id: insertedIds[2], person2_id: insertedIds[3], type: 'conjoint', date_debut: '1920-01-01', notes: 'Achille & Adele' },
      { person1_id: insertedIds[4], person2_id: insertedIds[5], type: 'conjoint', date_debut: '1948-01-01', notes: 'François & Solidea' },
      { person1_id: insertedIds[7], person2_id: insertedIds[9], type: 'conjoint', date_debut: '1980-01-01', date_fin: '1992-01-01', notes: 'Jean-Pol & Michelle (1er mariage)' },
      { person1_id: insertedIds[7], person2_id: insertedIds[10], type: 'conjoint', date_debut: '1994-01-01', notes: 'Jean-Pol & Olga (2ème mariage)' },
      
      // Fratrie génération 3 (enfants de François et Solidea)
      { person1_id: insertedIds[6], person2_id: insertedIds[7], type: 'frere', notes: 'Bernard & Jean-Pol' },
      { person1_id: insertedIds[6], person2_id: insertedIds[8], type: 'frere', notes: 'Bernard & Thierry' },
      { person1_id: insertedIds[7], person2_id: insertedIds[8], type: 'frere', notes: 'Jean-Pol & Thierry' },
      
      // Fratrie génération 4 (enfants de Jean-Pol, premier mariage)
      { person1_id: insertedIds[11], person2_id: insertedIds[12], type: 'frere', notes: 'Yohan & Gaël' },
      { person1_id: insertedIds[11], person2_id: insertedIds[13], type: 'frere', notes: 'Yohan & Eve' },
      { person1_id: insertedIds[12], person2_id: insertedIds[13], type: 'frere', notes: 'Gaël & Eve' },
      
      // Fratrie génération 4 (enfants de Jean-Pol, deuxième mariage)
      { person1_id: insertedIds[14], person2_id: insertedIds[15], type: 'frere', notes: 'François & Célia' },
      
      // Demi-fratrie (tous les enfants de Jean-Pol partagent le même père)
      { person1_id: insertedIds[11], person2_id: insertedIds[14], type: 'frere', notes: 'Yohan & François (demi-frères)' },
      { person1_id: insertedIds[11], person2_id: insertedIds[15], type: 'frere', notes: 'Yohan & Célia (demi-frères)' },
      { person1_id: insertedIds[12], person2_id: insertedIds[14], type: 'frere', notes: 'Gaël & François (demi-frères)' },
      { person1_id: insertedIds[12], person2_id: insertedIds[15], type: 'frere', notes: 'Gaël & Célia (demi-frères)' },
      { person1_id: insertedIds[13], person2_id: insertedIds[14], type: 'frere', notes: 'Eve & François (demi-frères)' },
      { person1_id: insertedIds[13], person2_id: insertedIds[15], type: 'frere', notes: 'Eve & Célia (demi-frères)' }
    ];
    
    for (const rel of relations) {
      await connection.query(
        'INSERT INTO relations (person1_id, person2_id, type_relation, date_debut, notes) VALUES (?, ?, ?, ?, ?)',
        [rel.person1_id, rel.person2_id, rel.type, rel.date_debut || null, rel.notes || null]
      );
      
      // Créer la relation réciproque
      let reciprocalType = rel.type;
      if (rel.type === 'parent') reciprocalType = 'enfant';
      else if (rel.type === 'enfant') reciprocalType = 'parent';
      
      await connection.query(
        'INSERT INTO relations (person1_id, person2_id, type_relation, date_debut, notes) VALUES (?, ?, ?, ?, ?)',
        [rel.person2_id, rel.person1_id, reciprocalType, rel.date_debut || null, rel.notes || null]
      );
      console.log(`  ✓ Relation ajoutée`);
    }
    
    console.log(`\n✅ ${relations.length} relations créées (+ réciproques)\n`);
    
    connection.release();
    
    // Afficher un résumé
    console.log('📊 RÉSUMÉ DES DONNÉES FAMILIALES');
    console.log('=====================================');
    console.log(`👥 Personnes: ${insertedIds.length}`);
    console.log(`   - Génération 1 (Arrière-grands-parents): 4 personnes`);
    console.log(`     * Omer Van Wymeersch & Adronie Reynaert`);
    console.log(`     * Achille Mella & Adele Pizzinatto`);
    console.log(`   - Génération 2 (Parents): 2 personnes`);
    console.log(`     * François Van Wymeersch & Solidea Mella`);
    console.log(`   - Génération 3 (Fratrie): 5 personnes`);
    console.log(`     * Bernard Van Wymeersch (1950-2005)`);
    console.log(`     * Jean-Pol Van Wymeersch (JPVW)`);
    console.log(`     * Thierry Daniel Ghislain Van Wymeersch`);
    console.log(`     * Michelle Cocriamont (1ère épouse de Jean-Pol)`);
    console.log(`     * Olga Mosala (2ème épouse de Jean-Pol)`);
    console.log(`   - Génération 4 (Enfants de Jean-Pol): 5 personnes`);
    console.log(`     * Yohan, Gaël, Eve (avec Michelle)`);
    console.log(`     * François, Célia (avec Olga)`);
    console.log(`🔗 Relations: ${relations.length} (+ réciproques)`);
    console.log(`   - Relations parent-enfant`);
    console.log(`   - Mariages (dont 2 pour Jean-Pol)`);
    console.log(`   - Fratries et demi-fratries`);
    console.log(`\n✅ Base de données peuplée avec succès !`);
    console.log(`\n🌐 Accédez à l'application: http://localhost:3007/\n`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécution
seedData().catch(err => {
  console.error(err);
  process.exit(1);
});
