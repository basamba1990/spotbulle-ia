const bcrypt = require('bcryptjs');
const { connectDB } = require('./src/config/db');
const User = require('./src/models/User');

async function createTestUser() {
  try {
    console.log('🔗 Connexion à la base de données...');
    await connectDB();
    
    const email = 'basamba1990@yahoo.fr';
    const password = 'TestPassword123!';
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('✅ L\'utilisateur existe déjà:', email);
      return;
    }
    
    // Créer l'utilisateur
    const user = await User.create({
      email: email,
      password_hash: password, // Le hook beforeCreate va hasher automatiquement
      nom: 'Ba',
      prenom: 'Samba',
      bio: 'Utilisateur de test',
      statut: 'actif',
      role: 'utilisateur'
    });
    
    console.log('✅ Utilisateur créé avec succès:');
    console.log('📧 Email:', user.email);
    console.log('🆔 ID:', user.id);
    console.log('👤 Nom:', user.prenom, user.nom);
    console.log('📊 Statut:', user.statut);
    console.log('🔑 Rôle:', user.role);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
  } finally {
    process.exit(0);
  }
}

createTestUser();
