const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const User = require('../models/User');
const Video = require('../models/Video');
const Participation = require('../models/Participation');

const userController = {
  // Obtenir le profil d'un utilisateur
  getProfile: async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable'
        });
      }

      // Si ce n'est pas l'utilisateur connecté et que le profil n'est pas public
      if (req.user?.id !== user.id && !user.preferences?.public_profile) {
        return res.status(403).json({
          success: false,
          message: 'Profil privé'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du profil'
      });
    }
  },

  // Mettre à jour le profil de l'utilisateur connecté
  updateProfile: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { nom, prenom, bio, preferences } = req.body;
      const userId = req.user.id;

      const updateData = {};
      if (nom !== undefined) updateData.nom = nom;
      if (prenom !== undefined) updateData.prenom = prenom;
      if (bio !== undefined) updateData.bio = bio;
      if (preferences !== undefined) {
        updateData.preferences = {
          ...req.user.preferences,
          ...preferences
        };
      }

      await User.update(updateData, {
        where: { id: userId }
      });

      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password_hash'] }
      });

      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour du profil'
      });
    }
  },

  // Obtenir les vidéos d'un utilisateur
  getUserVideos: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, thematique, statut } = req.query;
      
      const offset = (page - 1) * limit;
      
      const whereClause = { user_id: id };
      
      // Filtres
      if (thematique) whereClause.thematique = thematique;
      if (statut) whereClause.statut = statut;
      
      // Si ce n'est pas l'utilisateur connecté, ne montrer que les vidéos publiques
      if (req.user?.id !== id) {
        whereClause.statut = 'actif';
        whereClause['parametres_confidentialite.public'] = true; // ✅ CORRIGÉ
      }

      const { count, rows: videos } = await Video.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nom', 'prenom', 'avatar_url']
          }
        ],
        order: [['date_upload', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          videos,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Erreur récupération vidéos utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des vidéos'
      });
    }
  },

  // Rechercher des utilisateurs
  searchUsers: async (req, res) => {
    try {
      const { q, page = 1, limit = 10 } = req.query;
      
      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Le terme de recherche doit contenir au moins 2 caractères'
        });
      }

      const offset = (page - 1) * limit;
      const searchTerm = q.trim();

      const { count, rows: users } = await User.findAndCountAll({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                { nom: { [Op.iLike]: `%${searchTerm}%` } },
                { prenom: { [Op.iLike]: `%${searchTerm}%` } },
                { email: { [Op.iLike]: `%${searchTerm}%` } }
              ]
            },
            { statut: 'actif' },
            { '$preferences.public_profile$': true }
          ]
        },
        attributes: { exclude: ['password_hash', 'email'] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nom', 'ASC'], ['prenom', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Erreur recherche utilisateurs:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la recherche d\'utilisateurs'
      });
    }
  },

  // Obtenir les statistiques d'un utilisateur
  getUserStats: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Vérifier que l'utilisateur existe
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur introuvable'
        });
      }

      // Compter les vidéos
      const videosCount = await Video.count({
        where: { 
          user_id: id,
          statut: 'actif'
        }
      });

      // Compter les participations aux événements
      const participationsCount = await Participation.count({
        where: { 
          user_id: id,
          statut: ['confirme', 'present']
        }
      });

      // Calculer les vues totales des vidéos
      const totalViews = await Video.sum('vues', {
        where: { 
          user_id: id,
          statut: 'actif'
        }
      }) || 0;

      // Calculer les likes totaux
      const totalLikes = await Video.sum('likes', {
        where: { 
          user_id: id,
          statut: 'actif'
        }
      }) || 0;

      res.json({
        success: true,
        data: {
          stats: {
            videos_count: videosCount,
            participations_count: participationsCount,
            total_views: totalViews,
            total_likes: totalLikes
          }
        }
      });
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des statistiques'
      });
    }
  }
};

module.exports = userController;

