module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Liked_Users", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    fb_id: DataTypes.TEXT,
    event_id: DataTypes.TEXT,
    liked_fb_id: DataTypes.TEXT,
  });
};
