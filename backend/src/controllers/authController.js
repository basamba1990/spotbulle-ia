const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const authController = {
  // Inscription
  register: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { email, password, nom, prenom, bio } = req.body;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        });
      }

      // Créer l'utilisateur
      const user = await User.create({
        email,
        password_hash: password,
        nom,
        prenom,
        bio: bio || null
      });

      // Générer le token
      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        data: {
          user: user.getPublicData(),
          token
        }
      });
    } catch (error) {
      console.error('Erreur inscription:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'inscription'
      });
    }
  },

  // Connexion
  login: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Trouver l'utilisateur
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Vérifier le mot de passe
      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Vérifier le statut du compte
      if (user.statut !== 'actif') {
        return res.status(401).json({
          success: false,
          message: 'Compte inactif ou suspendu'
        });
      }

      // Mettre à jour la dernière connexion
      await user.update({ derniere_connexion: new Date() });

      // Générer le token
      const token = generateToken(user.id);

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: user.getPublicData(),
          token
        }
      });
    } catch (error) {
      console.error('Erreur connexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la connexion'
      });
    }
  },

  // Obtenir les informations de l'utilisateur connecté
  me: async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          user: req.user.getPublicData()
        }
      });
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du profil'
      });
    }
  },

  // Déconnexion (côté client principalement)
  logout: async (req, res) => {
    try {
      // Dans une implémentation plus avancée, on pourrait blacklister le token
      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la déconnexion'
      });
    }
  },

  // Rafraîchir le token
  refreshToken: async (req, res) => {
    try {
      const token = generateToken(req.user.id);
      
      res.json({
        success: true,
        message: 'Token rafraîchi avec succès',
        data: { token }
      });
    } catch (error) {
      console.error('Erreur rafraîchissement token:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors du rafraîchissement du token'
      });
    }
  }
};

module.exports = authController;

