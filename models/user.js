module.exports = function(sequelize, DataTypes) {
  return sequelize.define("User", {
    fb_id: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    fb_token: DataTypes.TEXT,
    firebase_token: DataTypes.TEXT,
  });
};
