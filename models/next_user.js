module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Next_User", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    fb_id: DataTypes.TEXT,
    event_id: DataTypes.TEXT,
    next_seq_id: DataTypes.BIGINT,
  });
};
