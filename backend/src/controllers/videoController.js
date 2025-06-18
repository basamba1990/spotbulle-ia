const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Video = require('../models/Video');
const User = require('../models/User');
const Event = require('../models/Event');
const Participation = require('../models/Participation');

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration Multer pour l'upload temporaire
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
});

const videoController = {
  // Middleware d'upload
  uploadMiddleware: upload.single('video'),

  // Upload d'une vidéo
  uploadVideo: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier vidéo fourni'
        });
      }

      const {
        titre,
        description,
        thematique,
        tags,
        evenement_id,
        parametres_confidentialite
      } = req.body;

      // Générer un nom de fichier unique
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
      const filePath = `videos/${req.user.id}/${fileName}`;

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('Erreur upload Supabase:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de l\'upload du fichier'
        });
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      // Créer l'enregistrement vidéo
      const video = await Video.create({
        user_id: req.user.id,
        titre,
        description,
        thematique,
        url_video: urlData.publicUrl,
        taille: req.file.size,
        format: req.file.mimetype,
        tags: tags ? JSON.parse(tags) : [],
        parametres_confidentialite: parametres_confidentialite ? 
          JSON.parse(parametres_confidentialite) : {
            public: true,
            commentaires_autorises: true,
            telechargement_autorise: false
          },
        statut: 'en_traitement'
      });

      // Si un événement est spécifié, créer ou mettre à jour la participation
      if (evenement_id) {
        const event = await Event.findByPk(evenement_id);
        if (event) {
          const [participation] = await Participation.findOrCreate({
            where: {
              user_id: req.user.id,
              evenement_id: evenement_id
            },
            defaults: {
              video_id: video.id,
              statut: 'confirme'
            }
          });

          if (!participation.video_id) {
            await participation.update({ video_id: video.id });
          }
        }
      }

      // Mettre à jour le statut à 'actif' (dans un vrai projet, cela se ferait après traitement)
      await video.update({ statut: 'actif' });

      const videoWithUser = await Video.findByPk(video.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nom', 'prenom', 'avatar_url']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Vidéo uploadée avec succès',
        data: { video: videoWithUser }
      });
    } catch (error) {
      console.error('Erreur upload vidéo:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'upload de la vidéo'
      });
    }
  },

  // Obtenir toutes les vidéos avec filtres
  getVideos: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        thematique,
        user_id,
        evenement_id,
        search,
        sort = 'recent'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { statut: 'actif' };

      // Filtres
      if (thematique) whereClause.thematique = thematique;
      if (user_id) whereClause.user_id = user_id;

      // Recherche textuelle
      if (search) {
        whereClause[Op.or] = [
          { titre: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { tags: { [Op.contains]: [search] } }
        ];
      }

      // Ne montrer que les vidéos publiques si l'utilisateur n'est pas connecté
      if (!req.user) {
        whereClause.parametres_confidentialite = {
          public: true
        };
      }

      // Tri
      let order;
      switch (sort) {
        case 'popular':
          order = [['vues', 'DESC'], ['likes', 'DESC']];
          break;
        case 'oldest':
          order = [['date_upload', 'ASC']];
          break;
        default:
          order = [['date_upload', 'DESC']];
      }

      const includeClause = [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nom', 'prenom', 'avatar_url']
        }
      ];

      // Si filtrage par événement
      if (evenement_id) {
        includeClause.push({
          model: Participation,
          as: 'participation',
          where: { evenement_id },
          required: true
        });
      }

      const { count, rows: videos } = await Video.findAndCountAll({
        where: whereClause,
        include: includeClause,
        order,
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
      console.error('Erreur récupération vidéos:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des vidéos'
      });
    }
  },

  // Obtenir une vidéo par ID
  getVideoById: async (req, res) => {
    try {
      const { id } = req.params;

      const video = await Video.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nom', 'prenom', 'avatar_url']
          }
        ]
      });

      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Vidéo introuvable'
        });
      }

      // Vérifier les permissions de visualisation
      if (!video.parametres_confidentialite?.public && 
          (!req.user || req.user.id !== video.user_id)) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé à cette vidéo privée'
        });
      }

      // Incrémenter le compteur de vues
      await video.increment('vues');

      res.json({
        success: true,
        data: { video }
      });
    } catch (error) {
      console.error('Erreur récupération vidéo:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération de la vidéo'
      });
    }
  },

  // Mettre à jour une vidéo
  updateVideo: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const video = await Video.findByPk(id);

      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Vidéo introuvable'
        });
      }

      // Vérifier que l'utilisateur est le propriétaire
      if (video.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Seul le propriétaire peut modifier cette vidéo'
        });
      }

      const updateData = { ...req.body };
      delete updateData.user_id; // Empêcher la modification du propriétaire
      delete updateData.url_video; // Empêcher la modification de l'URL

      await video.update(updateData);

      const updatedVideo = await Video.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'nom', 'prenom', 'avatar_url']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Vidéo mise à jour avec succès',
        data: { video: updatedVideo }
      });
    } catch (error) {
      console.error('Erreur mise à jour vidéo:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la mise à jour de la vidéo'
      });
    }
  },

  // Supprimer une vidéo
  deleteVideo: async (req, res) => {
    try {
      const { id } = req.params;
      const video = await Video.findByPk(id);

      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Vidéo introuvable'
        });
      }

      // Vérifier que l'utilisateur est le propriétaire
      if (video.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Seul le propriétaire peut supprimer cette vidéo'
        });
      }

      // Supprimer le fichier de Supabase Storage
      const urlParts = video.url_video.split('/');
      const filePath = urlParts.slice(-3).join('/'); // Récupérer le chemin relatif

      await supabase.storage
        .from('videos')
        .remove([filePath]);

      // Supprimer l'enregistrement de la base de données
      await video.destroy();

      res.json({
        success: true,
        message: 'Vidéo supprimée avec succès'
      });
    } catch (error) {
      console.error('Erreur suppression vidéo:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la suppression de la vidéo'
      });
    }
  },

  // Liker/Unliker une vidéo
  toggleLike: async (req, res) => {
    try {
      const { id } = req.params;
      const video = await Video.findByPk(id);

      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Vidéo introuvable'
        });
      }

      // Dans une implémentation complète, on aurait une table des likes
      // Pour simplifier, on incrémente/décrémente directement
      const action = req.body.action; // 'like' ou 'unlike'
      
      if (action === 'like') {
        await video.increment('likes');
      } else if (action === 'unlike') {
        await video.decrement('likes');
      }

      res.json({
        success: true,
        message: action === 'like' ? 'Vidéo likée' : 'Like retiré',
        data: { likes: video.likes + (action === 'like' ? 1 : -1) }
      });
    } catch (error) {
      console.error('Erreur toggle like:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la gestion du like'
      });
    }
  }
};

module.exports = videoController;

