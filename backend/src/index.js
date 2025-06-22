const User = require('./User');
const Video = require('./Video');
const Event = require('./Event');
const Participation = require('./Participation');

// Associations
User.hasMany(Video, {
  foreignKey: 'user_id',
  as: 'videos'
});
Video.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(Event, {
  foreignKey: 'organisateur_id',
  as: 'evenements_organises'
});
Event.belongsTo(User, {
  foreignKey: 'organisateur_id',
  as: 'organisateur'
});

User.hasMany(Participation, {
  foreignKey: 'user_id',
  as: 'participations'
});
Participation.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'participant'
});

Event.hasMany(Participation, {
  foreignKey: 'event_id',
  as: 'participations'
});
Participation.belongsTo(Event, {
  foreignKey: 'event_id',
  as: 'evenement'
});

module.exports = {
  User,
  Video,
  Event,
  Participation
};


