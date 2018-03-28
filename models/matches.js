module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Matches", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    fb_id: DataTypes.TEXT,
    matched_fb_id: DataTypes.TEXT,
  });
};
