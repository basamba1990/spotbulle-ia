// Fichier index pour centraliser les exports de configuration
const { sequelize, connectDB } = require('./db-production.js');

module.exports = {
  sequelize,
  connectDB
};

