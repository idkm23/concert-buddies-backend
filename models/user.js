module.exports = function(sequelize, DataTypes) {
  return sequelize.define("User", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    fb_token: DataTypes.TEXT,
    name: DataTypes.TEXT,
    dob: DataTypes.DATE,
    gender: DataTypes.BOOLEAN, // false = male, true = female
    pictures: DataTypes.ARRAY(DataTypes.BLOB)
  });
};
