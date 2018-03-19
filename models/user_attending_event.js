module.exports = function(sequelize, DataTypes) {
  return sequelize.define("User_Attending_Event", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    fb_user_id: DataTypes.TEXT,
    event_id: DataTypes.TEXT,
    seq_id: DataTypes.BIGINT,
  });
};
