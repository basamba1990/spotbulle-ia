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
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-quicktime', 'video/avi', 'video/wmv', 'video/webm', 'video/3gpp', 'video/3gpp2'];
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

