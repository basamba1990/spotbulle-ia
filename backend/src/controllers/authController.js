const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");

// Vérification obligatoire du secret JWT
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET manquant dans les variables d'environnement");
}

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
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
          message: "Données invalides",
          errors: errors.array()
        });
      }

      const { email, password, nom, prenom, bio } = req.body;

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ // 409 Conflict
          success: false,
          message: "Un utilisateur avec cet email existe déjà"
        });
      }

      // Hacher le mot de passe
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Créer l'utilisateur
      const user = await User.create({
        email,
        password_hash: hashedPassword,
        nom,
        prenom,
        bio: bio || null,
        statut: "actif",
        role: "utilisateur" // CORRECTION: Utiliser "utilisateur" au lieu de "user"
      });

      // Générer le token pour connexion automatique
      const token = generateToken(user.id);

      // Ne renvoyer que les données publiques
      const publicData = {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        bio: user.bio,
        statut: user.statut,
        role: user.role
      };

      res.status(201).json({
        success: true,
        message: "Utilisateur créé avec succès",
        data: {
          user: publicData,
          token
        }
      });
    } catch (error) {
      console.error("Erreur inscription:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de l'inscription",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
          message: "Données invalides",
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Trouver l'utilisateur avec les attributs nécessaires
      const user = await User.findOne({
        where: { email },
        attributes: ['id', 'email', 'password_hash', 'nom', 'prenom', 'bio', 'statut', 'role']
      });

      if (!user) {
        console.log(`Tentative de connexion échouée: email ${email} non trouvé`);
        return res.status(401).json({
          success: false,
          message: "Email ou mot de passe incorrect"
        });
      }

      // Vérifier le mot de passe avec bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        console.log(`Tentative de connexion échouée: mot de passe incorrect pour ${email}`);
        return res.status(401).json({
          success: false,
          message: "Email ou mot de passe incorrect"
        });
      }

      // Vérifier le statut du compte
      if (user.statut !== "actif") {
        return res.status(403).json({ // 403 Forbidden
          success: false,
          message: "Compte inactif ou suspendu"
        });
      }

      // Mettre à jour la dernière connexion
      await user.update({ derniere_connexion: new Date() });

      // Générer le token
      const token = generateToken(user.id);

      // Ne renvoyer que les données publiques
      const publicData = {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        bio: user.bio,
        statut: user.statut,
        role: user.role
      };

      res.json({
        success: true,
        message: "Connexion réussie",
        data: {
          user: publicData,
          token
        }
      });
    } catch (error) {
      console.error("Erreur connexion:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la connexion",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Obtenir les informations de l'utilisateur connecté
  me: async (req, res) => {
    try {
      // Charger les données à jour de l'utilisateur
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'email', 'nom', 'prenom', 'bio', 'statut', 'role', 'derniere_connexion']
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé"
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            bio: user.bio,
            statut: user.statut,
            role: user.role,
            derniere_connexion: user.derniere_connexion
          }
        }
      });
    } catch (error) {
      console.error("Erreur récupération profil:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération du profil",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Déconnexion
  logout: async (req, res) => {
    try {
      res.json({
        success: true,
        message: "Déconnexion réussie"
      });
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la déconnexion"
      });
    }
  },

  // Rafraîchir le token
  refreshToken: async (req, res) => {
    try {
      const token = generateToken(req.user.id);
      
      res.json({
        success: true,
        message: "Token rafraîchi avec succès",
        data: { token }
      });
    } catch (error) {
      console.error("Erreur rafraîchissement token:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors du rafraîchissement du token"
      });
    }
  }
};

module.exports = authController;

