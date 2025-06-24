const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const Event = require("../models/Event");
const User = require("../models/User");
const Video = require("../models/Video");
const Participation = require("../models/Participation");

const eventController = {
  // Créer un événement
  createEvent: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Données invalides",
          errors: errors.array()
        });
      }

      const {
        nom,
        description,
        date_debut,
        date_fin,
        lieu,
        thematique,
        image_url,
        capacite_max,
        prix,
        tags,
        coordonnees,
        parametres
      } = req.body;

      const event = await Event.create({
        nom,
        description,
        date_debut,
        date_fin,
        lieu,
        organisateur_id: req.user.id,
        thematique,
        image_url,
        capacite_max,
        prix: prix || 0,
        tags: tags || [],
        coordonnees,
        parametres: {
          public: true,
          inscription_requise: false,
          moderation_videos: true,
          ...parametres
        }
      });

      // Créer automatiquement une participation pour l'organisateur
      await Participation.create({
        user_id: req.user.id,
        evenement_id: event.id,
        statut: "confirme",
        role: "organisateur"
      });

      const eventWithOrganizer = await Event.findByPk(event.id, {
        include: [
          {
            model: User,
            as: "organisateur",
            attributes: ["id", "nom", "prenom", "avatar_url"]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: "Événement créé avec succès",
        data: { event: eventWithOrganizer }
      });
    } catch (error) {
      console.error("Erreur création événement:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la création de l'événement"
      });
    }
  },

  // Obtenir tous les événements avec filtres
  getEvents: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        thematique,
        statut,
        date_debut,
        date_fin,
        lieu,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filtres
      if (thematique) whereClause.thematique = thematique;
      if (statut) whereClause.statut = statut;
      if (lieu) whereClause.lieu = { [Op.iLike]: `%${lieu}%` };

      // Filtre par dates
      if (date_debut) {
        whereClause.date_debut = { [Op.gte]: new Date(date_debut) };
      }
      if (date_fin) {
        whereClause.date_fin = { [Op.lte]: new Date(date_fin) };
      }

      // Recherche textuelle
      if (search) {
        whereClause[Op.or] = [
          { nom: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Ne montrer que les événements publics si l'utilisateur n'est pas connecté
      if (!req.user) {
        whereClause["parametres.public"] = true; // Correction ici
      }

      const { count, rows: events } = await Event.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "organisateur",
            attributes: ["id", "nom", "prenom", "avatar_url"]
          }
        ],
        order: [["date_debut", "ASC"]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          events,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error("Erreur récupération événements:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des événements"
      });
    }
  },

  // Obtenir un événement par ID
  getEventById: async (req, res) => {
    try {
      const { id } = req.params;

      const event = await Event.findByPk(id, {
        include: [
          {
            model: User,
            as: "organisateur",
            attributes: ["id", "nom", "prenom", "avatar_url"]
          }
        ]
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Événement introuvable"
        });
      }

      // Vérifier si l'événement est public ou si l'utilisateur y participe
      if (!event.parametres?.public && req.user) {
        const participation = await Participation.findOne({
          where: {
            user_id: req.user.id,
            evenement_id: id
          }
        });

        if (!participation && req.user.id !== event.organisateur_id) {
          return res.status(403).json({
            success: false,
            message: "Accès refusé à cet événement privé"
          });
        }
      }

      res.json({
        success: true,
        data: { event }
      });
    } catch (error) {
      console.error("Erreur récupération événement:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération de l'événement"
      });
    }
  },

  // Mettre à jour un événement
  updateEvent: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Données invalides",
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const event = await Event.findByPk(id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Événement introuvable"
        });
      }

      // Vérifier que l'utilisateur est l'organisateur
      if (event.organisateur_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Seul l'organisateur peut modifier cet événement"
        });
      }

      const updateData = { ...req.body };
      delete updateData.organisateur_id; // Empêcher la modification de l'organisateur

      await event.update(updateData);

      const updatedEvent = await Event.findByPk(id, {
        include: [
          {
            model: User,
            as: "organisateur",
            attributes: ["id", "nom", "prenom", "avatar_url"]
          }
        ]
      });

      res.json({
        success: true,
        message: "Événement mis à jour avec succès",
        data: { event: updatedEvent }
      });
    } catch (error) {
      console.error("Erreur mise à jour événement:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour de l'événement"
      });
    }
  },

  // Supprimer un événement
  deleteEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const event = await Event.findByPk(id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Événement introuvable"
        });
      }

      // Vérifier que l'utilisateur est l'organisateur
      if (event.organisateur_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Seul l'organisateur peut supprimer cet événement"
        });
      }

      await event.destroy();

      res.json({
        success: true,
        message: "Événement supprimé avec succès"
      });
    } catch (error) {
      console.error("Erreur suppression événement:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression de l'événement"
      });
    }
  },

  // Obtenir les vidéos d'un événement
  getEventVideos: async (req, res) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const event = await Event.findByPk(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Événement introuvable"
        });
      }

      const offset = (page - 1) * limit;

      const { count, rows: videos } = await Video.findAndCountAll({
        include: [
          {
            model: Participation,
            as: "participation",
            where: { evenement_id: id },
            include: [
              {
                model: User,
                as: "user",
                attributes: ["id", "nom", "prenom", "avatar_url"]
              }
            ]
          }
        ],
        where: { statut: "actif" },
        order: [["date_upload", "DESC"]],
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
      console.error("Erreur récupération vidéos événement:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des vidéos"
      });
    }
  },

  // Participer à un événement
  joinEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const { commentaire } = req.body;

      const event = await Event.findByPk(id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Événement introuvable"
        });
      }

      // Vérifier si l'utilisateur participe déjà
      const existingParticipation = await Participation.findOne({
        where: {
          user_id: req.user.id,
          evenement_id: id
        }
      });

      if (existingParticipation) {
        return res.status(400).json({
          success: false,
          message: "Vous participez déjà à cet événement"
        });
      }

      // Vérifier la capacité maximale
      if (event.capacite_max) {
        const participantsCount = await Participation.count({
          where: {
            evenement_id: id,
            statut: ["inscrit", "confirme", "present"]
          }
        });

        if (participantsCount >= event.capacite_max) {
          return res.status(400).json({
            success: false,
            message: "Événement complet"
          });
        }
      }

      const participation = await Participation.create({
        user_id: req.user.id,
        evenement_id: id,
        commentaire,
        statut: event.parametres?.inscription_requise ? "inscrit" : "confirme"
      });

      res.status(201).json({
        success: true,
        message: "Participation enregistrée avec succès",
        data: { participation }
      });
    } catch (error) {
      console.error("Erreur participation événement:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de l'inscription à l'événement"
      });
    }
  }
};

module.exports = eventController;


