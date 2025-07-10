const { sequelize } = require("../config");
const User = require("./User");
const Event = require("./Event");
const Video = require("./Video");
const Participation = require("./Participation");

const models = {
  User,
  Event,
  Video,
  Participation,
};

// Définition des associations
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  ...models,
  sequelize, // Exporter sequelize pour la synchronisation si nécessaire
};



User.hasMany(Event, {
  foreignKey: 'organisateur_id',
  as: 'evenementsOrganises'
});
Event.belongsTo(User, {
  foreignKey: 'organisateur_id',
  as: 'organisateur'
});


