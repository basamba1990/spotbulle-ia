// backend/src/server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const path = require("path");

const { connectDB } = require("./config/db");

// Import des routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const videoRoutes = require("./routes/videoRoutes");
const analyseIARoutes = require("./routes/analyseIARoutes"); // Nouvelle route IA

// Import des modèles pour établir les associations
const User = require("./models/User");
const Event = require("./models/Event");
const Video = require("./models/Video");
const Participation = require("./models/Participation");

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration des associations entre modèles
const setupAssociations = () => {
    // User associations
    User.hasMany(Event, { foreignKey: "organisateur_id", as: "evenements_organises" });
    User.hasMany(Video, { foreignKey: "user_id", as: "videos" });
    User.hasMany(Participation, { foreignKey: "user_id", as: "participations" });

    // Event associations
    Event.belongsTo(User, { foreignKey: "organisateur_id", as: "organisateur" });
    Event.hasMany(Participation, { foreignKey: "evenement_id", as: "participations" });
    Event.hasMany(Video, { foreignKey: "evenement_id", as: "videos" });

    // Video associations
    Video.belongsTo(User, { foreignKey: "user_id", as: "user" });
    Video.belongsTo(Event, { foreignKey: "evenement_id", as: "evenement" });
    Video.belongsTo(Participation, { foreignKey: "participation_id", as: "participation" });

    // Participation associations
    Participation.belongsTo(User, { foreignKey: "user_id", as: "user" });
    Participation.belongsTo(Event, { foreignKey: "evenement_id", as: "evenement" });
    Participation.belongsTo(Video, { foreignKey: "video_id", as: "video" });
};

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

// Rate limiting pour prévenir les attaques par force brute
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par windowMs
    message: "Trop de requêtes depuis cette IP, veuillez réessayer après 15 minutes",
});
app.use(limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/ia", analyseIARoutes); // Nouvelle route IA

// Servir les fichiers statiques du frontend en production
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "..", "frontend", "out")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "..", "frontend", "out", "index.html"));
    });
}

// Gestion des erreurs 404
app.use((req, res, next) => {
    res.status(404).json({ message: "Route non trouvée" });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Quelque chose s'est mal passé!");
});

// Démarrage du serveur
const startServer = async () => {
    try {
        await connectDB();
        setupAssociations();
        app.listen(PORT, () => {
            console.log(`Serveur backend démarré sur le port ${PORT}`);
            console.log(`🤖 Nouvelles fonctionnalités IA disponibles sur /api/ia`);
        });
    } catch (error) {
        console.error("Erreur lors du démarrage du serveur:", error);
        process.exit(1);
    }
};

startServer();


