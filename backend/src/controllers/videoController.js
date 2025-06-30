const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const Video = require("../models/Video");
const User = require("../models/User");
const Event = require("../models/Event");
const Participation = require("../models/Participation");

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
    fileSize: 250 * 1024 * 1024 // 250MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/quicktime", "video/x-quicktime", "video/avi", "video/wmv", "video/webm", "video/3gpp", "video/3gpp2"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Type de fichier non autorisé"), false);
    }
  }
});

const uploadMiddleware = upload.single("video");

const uploadVideo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier vidéo fourni"
      });
    }

    const { titre, description, thematique, tags, evenement_id, parametres_confidentialite } = req.body;
    const userId = req.user.id; // Assurez-vous que l'ID utilisateur est disponible via authMiddleware

    // Upload vers Supabase Storage
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = `videos/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(process.env.BUCKET_NAME)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype
      });

    if (uploadError) {
      console.error("Erreur Supabase Storage:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'upload du fichier vidéo vers Supabase.",
        error: uploadError.message
      });
    }

    // Obtenir l'URL publique du fichier
    const { data: publicUrlData, error: publicUrlError } = await supabase.storage
      .from(process.env.BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Enregistrer les métadonnées de la vidéo dans la base de données
    const video = await Video.create({
      titre,
      description,
      thematique,
      tags: tags ? JSON.parse(tags) : [],
      chemin_fichier: filePath,
      url_video: publicUrl,
      user_id: userId,
      evenementId: evenement_id || null,
      parametres_confidentialite: parametres_confidentialite ? JSON.parse(parametres_confidentialite) : { public: true, commentaires_autorises: true, telechargement_autorise: false }
    });

    return res.status(201).json({
      success: true,
      message: "Vidéo uploadée avec succès",
      video: video
    });
  } catch (error) {
    console.error("Erreur lors de l'upload de la vidéo:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'upload de la vidéo.",
      error: error.message
    });
  }
};

// Obtenir toutes les vidéos
const getVideos = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Données de recherche invalides",
        errors: errors.array()
      });
    }

    const { page = 1, limit = 10, thematique, user_id, evenement_id, search, sort } = req.query;
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (thematique) {
      whereClause.thematique = thematique;
    }
    if (user_id) {
      whereClause.userId = user_id;
    }
    if (evenement_id) {
      whereClause.evenementId = evenement_id;
    }
    if (search) {
      whereClause[Op.or] = [
        { titre: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { tags: { [Op.contains]: [search] } }
      ];
    }

    let order = [["createdAt", "DESC"]];
    if (sort === "popular") {
      order = [["likes", "DESC"]];
    } else if (sort === "oldest") {
      order = [["createdAt", "ASC"]];
    }

    const { count, rows: videos } = await Video.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: order,
      include: [
        { model: User, as: "user", attributes: ["id", "email", "nom", "prenom"] },
        { model: Event, as: "evenement", attributes: ["id", "nom"] } 
      ]
    });

    return res.status(200).json({
      success: true,
      message: "Vidéos récupérées avec succès",
      totalVideos: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      videos: videos
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des vidéos:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des vidéos.",
      error: error.message
    });
  }
};

// Obtenir une vidéo par ID
const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findByPk(id, {
      include: [
        { model: User, as: "user", attributes: ["id", "email", "nom", "prenom"] },
        { model: Event, as: "evenement", attributes: ["id", "nom"] } 
      ]
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Vidéo non trouvée"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vidéo récupérée avec succès",
      video: video
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la vidéo par ID:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération de la vidéo.",
      error: error.message
    });
  }
};

// Mettre à jour une vidéo
const updateVideo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Données de mise à jour invalides",
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { titre, description, thematique, tags, parametres_confidentialite } = req.body;

    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Vidéo non trouvée"
      });
    }

    // Vérifier si l'utilisateur est le propriétaire de la vidéo
    if (video.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé"
      });
    }

    await video.update({
      titre: titre || video.titre,
      description: description || video.description,
      thematique: thematique || video.thematique,
      tags: tags || video.tags,
      parametres_confidentialite: parametres_confidentialite || video.parametres_confidentialite
    });

    return res.status(200).json({
      success: true,
      message: "Vidéo mise à jour avec succès",
      video: video
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la vidéo:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour de la vidéo.",
      error: error.message
    });
  }
};

// Supprimer une vidéo
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findByPk(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Vidéo non trouvée"
      });
    }

    // Vérifier si l'utilisateur est le propriétaire de la vidéo
    if (video.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé"
      });
    }

    // Supprimer la vidéo de Supabase Storage
    const { data, error } = await supabase.storage.from("videos").remove([video.chemin_fichier]);

    if (error) {
      console.error("Erreur lors de la suppression du fichier Supabase:", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de la suppression du fichier vidéo.",
        error: error.message
      });
    }

    await video.destroy();

    return res.status(200).json({
      success: true,
      message: "Vidéo supprimée avec succès"
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de la vidéo:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de la vidéo.",
      error: error.message
    });
  }
};

// Gérer les likes/unlikes
const toggleLike = async (req, res) => {
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
    const { action } = req.body;
    const userId = req.user.id;

    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Vidéo non trouvée"
      });
    }

    let message;
    if (action === "like") {
      await video.addLike(userId);
      message = "Vidéo aimée avec succès";
    } else if (action === "unlike") {
      await video.removeLike(userId);
      message = "Like retiré avec succès";
    }

    // Mettre à jour le compteur de likes
    video.likesCount = await video.countLikes();
    await video.save();

    return res.status(200).json({
      success: true,
      message: message,
      likesCount: video.likesCount
    });
  } catch (error) {
    console.error("Erreur lors de la gestion du like:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la gestion du like.",
      error: error.message
    });
  }
};

module.exports = {
  uploadMiddleware,
  uploadVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  toggleLike,
};


