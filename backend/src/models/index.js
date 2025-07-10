const { sequelize } = require("../config");
const User = require("./User");
const Event = require("./Event");
const Video = require("./Video");
const Participation = require("./Participation");

// Définition des associations
// Un utilisateur peut organiser plusieurs événements
User.hasMany(Event, {
  foreignKey: "organisateur_id",
  as: "evenementsOrganises",
});

// Un événement appartient à un organisateur (utilisateur)
Event.belongsTo(User, {
  foreignKey: "organisateur_id",
  as: "organisateur",
});

// Un utilisateur peut participer à plusieurs événements
User.hasMany(Participation, {
  foreignKey: "user_id",
  as: "userParticipations",
});

// Une participation appartient à un utilisateur
Participation.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// Une participation appartient à un événement
Participation.belongsTo(Event, {
  foreignKey: "evenement_id",
  as: "event",
});

// Un événement peut avoir plusieurs participations
Event.hasMany(Participation, {
  foreignKey: "evenement_id",
  as: "eventParticipations",
});

// Une vidéo est liée à une participation (qui elle-même est liée à un utilisateur et un événement)
Video.belongsTo(Participation, {
  foreignKey: "participation_id",
  as: "videoParticipation", // Changement d'alias
});

// Une participation peut avoir plusieurs vidéos
Participation.hasMany(Video, {
  foreignKey: "participation_id",
  as: "videos",
});

module.exports = {
  User,
  Event,
  Video,
  Participation,
  sequelize // Exporter sequelize pour la synchronisation si nécessaire
};

